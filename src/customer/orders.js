import { Router } from "express";
import { prisma } from '../../config/prismaConfig.js' // adjust path if different
import { customerMiddleware } from "../../middlewares/customerAuth.js";

export const customerOrdersRouter = Router();

function isCouponApplicableToOrder(coupon, items) {
    const applicableOn = Array.isArray(coupon?.applicableOn) ? coupon.applicableOn : [];
    if (applicableOn.length === 0) return true;

    return items.some((item) => applicableOn.includes(item.productId) || (item.categoryId && applicableOn.includes(item.categoryId)));
}

customerOrdersRouter.post('/', customerMiddleware, async (req, res) => {
    console.log(`Customer ${req.customerid} is placing an order with data:`, req.body);
    const { items, paymentType, addressId, couponCode, couponId } = req.body;
    if (!addressId) return res.status(400).json({ success: false, message: "addressId required" });
    if (!Array.isArray(items) || items.length === 0)
        return res.status(400).json({ success: false, message: "items required" });
    if (!paymentType || !["COD", "CASH"].includes(paymentType))
        return res.status(400).json({ success: false, message: "invalid paymentType" });

    try {
        const customer = await prisma.customer.findUnique({
            where: { id: req.customerid },
            select: { id: true, userid: true }
        });
        if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

        // Validate address belongs to this customer
        const deliveryAddress = await prisma.address.findFirst({
            where: { id: addressId, customerid: customer.id }
        });
        if (!deliveryAddress) {
            return res.status(400).json({ success: false, message: "Invalid addressId" });
        }

        const itemIds = [...new Set(items.map(i => i.itemId))];
        const dbItems = await prisma.item.findMany({
            where: { id: { in: itemIds } },
            select: {
                id: true,
                shopkeeperId: true,
                title: true,
                images: true,
                categoryId: true
            }
        });
        if (dbItems.length !== itemIds.length)
            return res.status(400).json({ success: false, message: "Some items not found" });

        const shopkeeperSet = new Set(dbItems.map(i => i.shopkeeperId));
        if (shopkeeperSet.size !== 1)
            return res.status(400).json({ success: false, message: "All items must belong to same shopkeeper" });
        const shopkeeperId = dbItems[0].shopkeeperId;

        let coupon = null;
        let discountAmount = 0;
        let resolvedCouponCode = null;

        if (couponCode || couponId) {
            coupon = await prisma.coupon.findFirst({
                where: couponId ? { id: couponId } : { code: couponCode }
            });

            if (!coupon) {
                return res.status(400).json({ success: false, message: 'Coupon not found' });
            }

            const now = new Date();
            if (coupon.status !== 'ACTIVE') {
                return res.status(400).json({ success: false, message: 'Coupon is not active' });
            }
            if (coupon.startDate && coupon.startDate > now) {
                return res.status(400).json({ success: false, message: 'Coupon is not active yet' });
            }
            if (coupon.endDate && coupon.endDate < now) {
                return res.status(400).json({ success: false, message: 'Coupon has expired' });
            }
        }

        // Fetch any variants referenced by client
        const variantIds = [...new Set(items.map(i => i.variantId).filter(Boolean))];
        const dbVariants = variantIds.length ? await prisma.productVariant.findMany({ where: { id: { in: variantIds } }, select: { id: true, mrp: true, sellingPrice: true, productId: true, name: true, sku: true, stockQty: true, product: { select: { id: true, title: true, images: true } } } }) : [];
        const variantMap = new Map(dbVariants.map(v => [v.id, v]));

        let total = 0;
        const orderItemsData = [];
        let couponConnect = null;
        for (const reqItem of items) {
            const dbItem = dbItems.find(i => i.id === reqItem.itemId);
            const quantity = parseInt(reqItem.quantity, 10);
            if (!Number.isInteger(quantity) || quantity <= 0)
                return res.status(400).json({ success: false, message: `Invalid quantity for item ${dbItem?.id}` });

            const foundVariant = reqItem.variantId ? variantMap.get(reqItem.variantId) : null;
            if (!foundVariant) {
                return res.status(400).json({ success: false, message: `Variant ${reqItem.variantId || ''} not found` });
            }
            if (foundVariant.productId !== dbItem.id) {
                return res.status(400).json({ success: false, message: `Variant does not belong to item ${dbItem.id}` });
            }
            if (foundVariant.stockQty < quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for variant ${foundVariant.id}` });
            }

            const unitPrice = Number(foundVariant.sellingPrice);
            const mrp = Number(foundVariant.mrp);
            if (Number.isNaN(unitPrice) || Number.isNaN(mrp)) {
                return res.status(400).json({ success: false, message: `Price missing for item ${dbItem.id}` });
            }

            const lineTotal = unitPrice * quantity;
            total += lineTotal;
            orderItemsData.push({
                productId: dbItem.id,
                itemId: dbItem.id,
                quantity,
                mrp,
                sellingPrice: unitPrice,
                total: lineTotal,
                variantId: reqItem.variantId,
                productName: dbItem.title,
                variantName: foundVariant.name,
                sku: foundVariant.sku,
                imageUrl: dbItem.images?.[0] || null
            });
        }

        if (coupon) {
            if (coupon.isFirstOrder) {
                const orderCount = await prisma.order.count({ where: { customerId: customer.id } });
                if (orderCount > 0) {
                    return res.status(400).json({ success: false, message: 'Coupon is only valid on the first order' });
                }
            }

            if (!isCouponApplicableToOrder(coupon, dbItems)) {
                return res.status(400).json({ success: false, message: 'Coupon does not apply to these products' });
            }

            const userUsageCount = await prisma.couponUsage.count({
                where: { couponId: coupon.id, userId: customer.userid }
            });
            if (coupon.usageLimitPerUser !== null && coupon.usageLimitPerUser !== undefined && userUsageCount >= coupon.usageLimitPerUser) {
                return res.status(400).json({ success: false, message: 'Coupon usage limit per user reached' });
            }

            if (coupon.minOrderAmount && total < Number(coupon.minOrderAmount)) {
                return res.status(400).json({ success: false, message: 'Order amount is below coupon minimum' });
            }

            if (coupon.discountType === 'PERCENTAGE') {
                discountAmount = (total * Number(coupon.discountValue)) / 100;
                if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined) {
                    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
                }
            } else if (coupon.discountType === 'FLAT') {
                discountAmount = Number(coupon.discountValue);
            }

            discountAmount = Math.max(0, Math.min(discountAmount, total));
            resolvedCouponCode = coupon.code;
            couponConnect = { connect: { id: coupon.id } };
        }

        const created = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    customer: { connect: { id: customer.id } },
                    shopkeeper: { connect: { id: shopkeeperId } },
                    paymentType,
                    discountAmount,
                    grandTotal: total - discountAmount,
                    couponCode: resolvedCouponCode,
                    ...(couponConnect ? { coupon: couponConnect } : {}),
                    deliveryAddress: { connect: { id: addressId } },
                    orderItems: { create: orderItemsData }
                },
                include: {
                    orderItems: { include: { item: { select: { title: true, unit: true } }, variant: { select: { name: true, mrp: true, sellingPrice: true, sku: true } } } },
                    deliveryAddress: { select: { city: true, state: true, pincode: true, flatnumber: true, latitude: true, longitude: true } }
                }
            });

            if (coupon) {
                await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
                await tx.couponUsage.create({ data: { couponId: coupon.id, userId: customer.userid, orderId: order.id } });
            }

            return order;
        });

        return res.json({ success: true, order: created });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

/**
 * Get all orders of customer
 */
// customerOrdersRouter.get('/', customerMiddleware, async (req, res) => {
//     try {
//         const orders = await prisma.order.findMany({
//             where: { customerId: req.customerid },
//             orderBy: { createdAt: 'desc' },
//             include: {
//                 orderItems: {
//                     include: {
//                         item: { select: { title: true, images: true } },
//                         variant: { select: { name: true, mrp: true, images: true } }
//                     }
//                 },
//                 shopkeeper: { select: { shopname: true } },
//             }
//         });

//         // Trim to only needed fields
//         const shaped = orders.map(o => ({
//             id: o.id,
//             paymentType: o.paymentType,
//             grandTotal: o.grandTotal,
//             status: o.status,
//             createdAt: o.createdAt,
//             shopkeeper: o.shopkeeper,
//             orderItems: o.orderItems.map(oi => ({
//                 variant: oi.variant
//             })),
//         }));

//         res.json({ success: true, orders: shaped });
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// });


customerOrdersRouter.get('/', customerMiddleware, async (req, res) => {
    try {
        // 1. Get the userId associated with this customer
        const customer = await prisma.customer.findUnique({
            where: { id: req.customerid },
            select: { userid: true }
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        // 2. Fetch the orders and include the averageRating from the variant
        const orders = await prisma.order.findMany({
            where: { customerId: req.customerid },
            orderBy: { createdAt: 'desc' },
            include: {
                orderItems: {
                    include: {
                        item: { select: { title: true, images: true } },
                        variant: {
                            select: {
                                id: true,
                                name: true,
                                mrp: true,
                                images: true,
                                averageRating: true, // Item's overall average rating
                                totalReviews: true
                            }
                        }
                    }
                },
                shopkeeper: { select: { shopname: true } },
            }
        });

        if (!orders.length) {
            return res.json({ success: true, orders: [] });
        }

        // 3. Extract order IDs to fetch user's reviews for these specific orders
        const orderIds = orders.map(o => o.id);

        const userReviews = await prisma.review.findMany({
            where: {
                userId: customer.userid,
                orderId: { in: orderIds }
            },
            select: {
                orderId: true,
                variantId: true,
                rating: true
            }
        });

        // 4. Create a quick lookup map: Key = `${orderId}_${variantId}` -> Value = rating
        const reviewMap = new Map();
        userReviews.forEach(review => {
            reviewMap.set(`${review.orderId}_${review.variantId}`, review.rating);
        });

        // 5. Trim to only needed fields and append the rating data
        const shaped = orders.map(o => ({
            id: o.id,
            paymentType: o.paymentType,
            grandTotal: o.grandTotal,
            status: o.status,
            createdAt: o.createdAt,
            shopkeeper: o.shopkeeper,
            orderItems: o.orderItems.map(oi => {

                // Check if the user reviewed this specific variant in this specific order
                const myRating = reviewMap.get(`${o.id}_${oi.variant.id}`);

                return {
                    // I've included the item title/images here since you queried them but dropped them in your original map. 
                    // Remove `item: oi.item` if you strictly only want the variant object.
                    item: oi.item,
                    variant: oi.variant,

                    // New Fields
                    isRatedByMe: !!myRating,
                    myRating: myRating || null,
                    averageRating: oi.variant.averageRating // Overall variant rating
                };
            }),
        }));

        res.json({ success: true, orders: shaped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


/**
 * Get single order
 */
customerOrdersRouter.get('/:id', customerMiddleware, async (req, res) => {
    try {
        const order = await prisma.order.findFirst({
            where: { id: req.params.id, customerId: req.customerid },
            include: {
                orderItems: { include: { item: { select: { title: true, images: true, unit: true } }, variant: { select: { name: true, mrp: true, sellingPrice: true, sku: true } } } },
                shopkeeper: { select: { shopname: true } },
                deliveryAddress: { select: { city: true, state: true, pincode: true, flatnumber: true, latitude: true, longitude: true } }
            }
        });
        if (!order) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, order });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

/**
 * Cancel an order
 */
customerOrdersRouter.put('/:id/cancel', customerMiddleware, async (req, res) => {
    console.log(`Customer ${req.customerid} requested cancellation for order ${req.params.id}`);
    console.log(`Request body:`, req.body);
    try {
        const { cancelReason } = req.body;
        if (!cancelReason || !String(cancelReason).trim()) {
            return res.status(400).json({ success: false, message: "cancelReason is required" });
        }

        const order = await prisma.order.findFirst({
            where: { id: req.params.id, customerId: req.customerid }
        });
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        // Assuming orders can only be cancelled if status is not DELIVERED
        if (order.status === 'DELIVERED') {
            return res.status(400).json({ success: false, message: "Order cannot be cancelled at this stage" });
        }

        await prisma.order.update({
            where: { id: req.params.id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: String(cancelReason).trim()
            }
        });

        res.json({ success: true, message: "Order cancelled successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});