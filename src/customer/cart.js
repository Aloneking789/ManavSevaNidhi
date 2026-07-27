import { Router } from "express";
import { prisma } from '../../config/prismaConfig.js';
import { customerMiddleware } from "../../middlewares/customerAuth.js";
import { getUserCartAndWishlistSets } from "./utils.js";

import Razorpay from "razorpay";
import crypto from "crypto"

export const customerCartRouter = Router();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


async function createOrderFromCart({
    customerId,
    addressId,
    paymentType,
    cart,
    subtotal,
    discountAmount,
    paymentData = null
}) {

    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
            id: true,
            userid: true
        }
    });

    const cartItems = cart.items;

    const shopkeeperIds = new Set(
        cartItems.map(
            (item) => item.product.shopkeeperId
        )
    );

    const orderItems = cartItems.map((item) => ({
        productId: item.productId,
        itemId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        mrp: item.variant.mrp,
        sellingPrice: item.variant.sellingPrice,
        total:
            Number(item.variant.sellingPrice) *
            item.quantity,
        productName: item.product.title,
        variantName: item.variant.name,
        sku: item.variant.sku,
        imageUrl: item.product.images?.[0] || null
    }));

    return prisma.$transaction(async (tx) => {

        const order = await tx.order.create({
            data: {
                customer: {
                    connect: { id: customer.id }
                },

                shopkeeper: {
                    connect: {
                        id: [...shopkeeperIds][0]
                    }
                },

                paymentType: "ONLINE",

                discountAmount,

                grandTotal: subtotal - discountAmount,

                deliveryAddress: {
                    connect: { id: addressId }
                },

                orderItems: {
                    create: orderItems
                }
            },

            include: {
                orderItems: true
            }
        });

        // Create payment row for ONLINE
        if (paymentData) {

            await tx.payment.create({
                data: {
                    orderId: order.id,
                    method: 'UPI',
                    status: 'CAPTURED',
                    amount: subtotal - discountAmount,

                    gatewayOrderId:
                        paymentData.razorpay_order_id,

                    gatewayPaymentId:
                        paymentData.razorpay_payment_id,

                    gatewaySignature:
                        paymentData.razorpay_signature,

                    gatewayResponse: paymentData,

                    paidAt: new Date()
                }
            });

        }

        // clear cart
        await tx.cartItem.deleteMany({
            where: {
                cartId: cart.id
            }
        });

        await tx.cart.update({
            where: { id: cart.id },
            data: { couponId: null }
        });

        return order;
    });
}


function isCouponApplicableToItems(coupon, items) {
    const applicableOn = Array.isArray(coupon?.applicableOn) ? coupon.applicableOn : [];
    if (applicableOn.length === 0) return true;

    return items.some((item) => applicableOn.includes(item.productId) || (item.product.categoryId && applicableOn.includes(item.product.categoryId)));
}

function parsePositiveInt(value, fallback = 1) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function getOrCreateCart(customerId) {
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { userid: true }
    });

    if (!customer) {
        throw new Error('Customer not found');
    }

    return prisma.cart.upsert({
        where: { userId: customer.userid },
        update: {},
        create: { userId: customer.userid }
    });
}

async function loadCart(customerId) {
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { userid: true }
    });

    if (!customer) {
        return null;
    }

    let cart = await prisma.cart.findUnique({
        where: { userId: customer.userid },
        include: {
            coupon: true,
            items: {
                include: {
                    product: { select: { id: true, title: true, images: true, slug: true, categoryId: true, shopkeeperId: true } },
                    variant: { select: { id: true, name: true, sku: true, mrp: true, sellingPrice: true, stockQty: true, lowStockAlert: true, isActive: true, productId: true } }
                },
                orderBy: { addedAt: 'desc' }
            }
        }
    });

    if (cart && cart.coupon) {
        let isApplicable = true;

        // Check standard validations (status, dates, usage limit, minOrderAmount)
        const subtotal = cart.items.reduce((sum, item) => sum + (Number(item.variant.sellingPrice) * item.quantity), 0);
        const validation = isCouponValid(cart.coupon, subtotal);
        if (!validation.valid) {
            isApplicable = false;
        }

        // Check first order requirement
        if (isApplicable && cart.coupon.isFirstOrder) {
            const orderCount = await prisma.order.count({ where: { customerId } });
            if (orderCount > 0) {
                isApplicable = false;
            }
        }

        // Check item/category applicability
        if (isApplicable && !isCouponApplicableToItems(cart.coupon, cart.items)) {
            isApplicable = false;
        }

        // Check usage limit per user
        if (isApplicable && cart.coupon.usageLimitPerUser !== null && cart.coupon.usageLimitPerUser !== undefined) {
            const userUsageCount = await prisma.couponUsage.count({
                where: { couponId: cart.coupon.id, userId: customer.userid }
            });
            if (userUsageCount >= cart.coupon.usageLimitPerUser) {
                isApplicable = false;
            }
        }

        if (!isApplicable) {
            await prisma.cart.update({
                where: { id: cart.id },
                data: { couponId: null }
            });
            cart.coupon = null;
            cart.couponId = null;
        }
    }

    return cart;
}


async function getItemCount(customerId) {
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { userid: true }
    });

    // If customer doesn't exist, return a default zero count object
    if (!customer) {
        return { _count: { items: 0 } };
    }


    const cart = await prisma.cart.findUnique({
        where: { userId: customer.userid },
        select: {
            _count: {
                select: {
                    items: true,
                },
            },
        },
    });

    // If the cart doesn't exist yet, return a safe fallback object
    return cart || { _count: { items: 0 } };
}

function shapeCart(cart, userWishlistVariantIds = new Set(), userWishlistProductIds = new Set()) {
    if (!cart) {
        return { id: null, coupon: null, items: [], subtotal: 0, itemCount: 0 };
    }

    const items = cart.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        addedAt: item.addedAt,
        product: item.product,
        variant: {
            ...item.variant,
            isAddedToCart: true,
            isAddedToWishlist: userWishlistVariantIds.has(item.variant.id) || userWishlistProductIds.has(item.productId)
        },
        lineTotal: Number(item.variant.sellingPrice) * item.quantity
    }));

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

    return {
        id: cart.id,
        coupon: cart.coupon,
        items,
        subtotal,
        itemCount: items.length
    };
}

function isCouponValid(coupon, subtotal) {
    const now = new Date();
    if (!coupon) return { valid: false, message: 'Coupon not found' };
    if (coupon.status !== 'ACTIVE') return { valid: false, message: 'Coupon is not active' };
    if (coupon.startDate && coupon.startDate > now) return { valid: false, message: 'Coupon is not active yet' };
    if (coupon.endDate && coupon.endDate < now) return { valid: false, message: 'Coupon has expired' };
    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) return { valid: false, message: 'Order amount is below coupon minimum' };
    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
    return { valid: true };
}

function calculateCouponDiscount(coupon, subtotal) {
    if (!coupon) return 0;
    const amount = Number(subtotal || 0);
    const value = Number(coupon.discountValue || 0);
    let discount = 0;

    if (coupon.discountType === 'PERCENTAGE') {
        discount = (amount * value) / 100;
        if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined) {
            discount = Math.min(discount, Number(coupon.maxDiscountAmount));
        }
    } else if (coupon.discountType === 'FLAT') {
        discount = value;
    }

    return Math.max(0, Math.min(discount, amount));
}

customerCartRouter.get('/', customerMiddleware, async (req, res) => {
    try {
        const cart = await loadCart(req.customerid);
        const { userWishlistVariantIds, userWishlistProductIds } = await getUserCartAndWishlistSets(req.customerid);
        return res.json({ success: true, cart: shapeCart(cart, userWishlistVariantIds, userWishlistProductIds) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

customerCartRouter.get('/summary', customerMiddleware, async (req, res) => {
    try {
        const cart = await loadCart(req.customerid);
        const shaped = shapeCart(cart);
        const discount = calculateCouponDiscount(cart?.coupon, shaped.subtotal);

        return res.json({
            success: true,
            summary: {
                cartId: shaped.id,
                itemCount: shaped.itemCount,
                subtotal: shaped.subtotal,
                discount,
                total: shaped.subtotal - discount,
                coupon: shaped.coupon
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});
customerCartRouter.get('/count', customerMiddleware, async (req, res) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: req.customerid },
            select: { userid: true }
        });

        if (!customer) {
            return res.json({
                success: true,
                count: 0,
                wishlistCount: 0
            });
        }

        const [cart, wishlist] = await Promise.all([
            prisma.cart.findUnique({
                where: { userId: customer.userid },
                select: {
                    _count: {
                        select: { items: true }
                    }
                }
            }),
            prisma.wishlist.findUnique({
                where: { userId: customer.userid },
                select: {
                    _count: {
                        select: { items: true }
                    }
                }
            })
        ]);

        return res.json({
            success: true,
            count: cart?._count.items || 0,
            wishlistCount: wishlist?._count.items || 0
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

customerCartRouter.post('/items', customerMiddleware, async (req, res) => {
    const { itemId, variantId, quantity = 1 } = req.body;
    if (!itemId || !variantId) {
        return res.status(400).json({ success: false, message: 'itemId and variantId are required' });
    }

    const qty = parsePositiveInt(quantity);

    try {
        const product = await prisma.item.findFirst({ where: { id: itemId, isActive: true } });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const variant = await prisma.productVariant.findFirst({
            where: { id: variantId, productId: itemId, isActive: true },
            select: { id: true, stockQty: true }
        });
        if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

        const cart = await getOrCreateCart(req.customerid);
        const existing = await prisma.cartItem.findUnique({
            where: { cartId_variantId: { cartId: cart.id, variantId } }
        });

        const nextQuantity = (existing?.quantity || 0) + qty;
        if (nextQuantity > variant.stockQty) {
            return res.status(400).json({ success: false, message: 'Insufficient stock for this variant' });
        }

        await prisma.cartItem.upsert({
            where: { cartId_variantId: { cartId: cart.id, variantId } },
            update: { quantity: nextQuantity },
            create: { cartId: cart.id, productId: itemId, variantId, quantity: qty }
        });

        const updatedCart = await loadCart(req.customerid);
        const { userWishlistVariantIds, userWishlistProductIds } = await getUserCartAndWishlistSets(req.customerid);
        return res.status(201).json({ success: true, cart: shapeCart(updatedCart, userWishlistVariantIds, userWishlistProductIds) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

customerCartRouter.put('/items/:variantId', customerMiddleware, async (req, res) => {
    const { variantId } = req.params;
    const { quantity } = req.body;
    const qty = parsePositiveInt(quantity, 0);
    if (qty <= 0) {
        return res.status(400).json({ success: false, message: 'quantity must be a positive integer' });
    }

    try {
        const customer = await prisma.customer.findUnique({ where: { id: req.customerid }, select: { userid: true } });
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        const cart = await prisma.cart.findUnique({ where: { userId: customer.userid } });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

        const cartItem = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
        if (!cartItem) return res.status(404).json({ success: false, message: 'Cart item not found' });

        const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { stockQty: true } });
        if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });
        if (qty > variant.stockQty) {
            return res.status(400).json({ success: false, message: 'Insufficient stock for this variant' });
        }

        await prisma.cartItem.update({ where: { cartId_variantId: { cartId: cart.id, variantId } }, data: { quantity: qty } });

        const updatedCart = await loadCart(req.customerid);
        const { userWishlistVariantIds, userWishlistProductIds } = await getUserCartAndWishlistSets(req.customerid);
        return res.json({ success: true, cart: shapeCart(updatedCart, userWishlistVariantIds, userWishlistProductIds) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

customerCartRouter.delete('/items/:variantId', customerMiddleware, async (req, res) => {
    const { variantId } = req.params;
    try {
        const customer = await prisma.customer.findUnique({ where: { id: req.customerid }, select: { userid: true } });
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        const cart = await prisma.cart.findUnique({ where: { userId: customer.userid } });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

        await prisma.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });

        const updatedCart = await loadCart(req.customerid);
        const { userWishlistVariantIds, userWishlistProductIds } = await getUserCartAndWishlistSets(req.customerid);
        return res.json({ success: true, cart: shapeCart(updatedCart, userWishlistVariantIds, userWishlistProductIds) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

customerCartRouter.delete('/clear', customerMiddleware, async (req, res) => {
    try {
        const customer = await prisma.customer.findUnique({ where: { id: req.customerid }, select: { userid: true } });
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        const cart = await prisma.cart.findUnique({ where: { userId: customer.userid } });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });

        return res.json({ success: true, message: 'Cart cleared' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

customerCartRouter.post('/coupon/apply', customerMiddleware, async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'code is required' });

    try {
        const cart = await loadCart(req.customerid);
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        const customer = await prisma.customer.findUnique({ where: { id: req.customerid }, select: { id: true, userid: true } });
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        const coupon = await prisma.coupon.findUnique({ where: { code } });
        const subtotal = shapeCart(cart).subtotal;
        const validation = isCouponValid(coupon, subtotal);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        if (coupon.isFirstOrder) {
            const orderCount = await prisma.order.count({ where: { customerId: req.customerid } });
            if (orderCount > 0) {
                return res.status(400).json({ success: false, message: 'Coupon is only valid on the first order' });
            }
        }

        if (!isCouponApplicableToItems(coupon, cart.items)) {
            return res.status(400).json({ success: false, message: 'Coupon does not apply to these products' });
        }

        const userUsageCount = await prisma.couponUsage.count({
            where: { couponId: coupon.id, userId: customer.userid }
        });
        if (coupon.usageLimitPerUser !== null && coupon.usageLimitPerUser !== undefined && userUsageCount >= coupon.usageLimitPerUser) {
            return res.status(400).json({ success: false, message: 'Coupon usage limit per user reached' });
        }

        await prisma.cart.update({ where: { userId: customer.userid }, data: { couponId: coupon.id } });

        const updatedCart = await loadCart(req.customerid);
        const { userWishlistVariantIds, userWishlistProductIds } = await getUserCartAndWishlistSets(req.customerid);
        const shaped = shapeCart(updatedCart, userWishlistVariantIds, userWishlistProductIds);
        const discount = calculateCouponDiscount(updatedCart.coupon, shaped.subtotal);

        return res.json({ success: true, cart: { ...shaped, discount, total: shaped.subtotal - discount } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

customerCartRouter.delete('/coupon', customerMiddleware, async (req, res) => {
    try {
        const customer = await prisma.customer.findUnique({ where: { id: req.customerid }, select: { userid: true } });
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        const cart = await prisma.cart.findUnique({ where: { userId: customer.userid } });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

        await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
        return res.json({ success: true, message: 'Coupon removed' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

customerCartRouter.post('/checkout', customerMiddleware, async (req, res) => {
    const { addressId, paymentType } = req.body;
    if (!addressId) return res.status(400).json({ success: false, message: 'addressId required' });
    if (!paymentType || !['COD', 'ONLINE'].includes(paymentType)) {
        return res.status(400).json({ success: false, message: 'invalid paymentType' });
    }

    try {
        const cart = await loadCart(req.customerid);
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        const customer = await prisma.customer.findUnique({ where: { id: req.customerid }, select: { id: true, userid: true } });
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        const deliveryAddress = await prisma.address.findFirst({ where: { id: addressId, customerid: customer.id } });
        if (!deliveryAddress) {
            return res.status(400).json({ success: false, message: 'Invalid addressId' });
        }

        const cartItems = cart.items;
        const shopkeeperIds = new Set(cartItems.map((item) => item.product.shopkeeperId));
        if (shopkeeperIds.size !== 1) {
            return res.status(400).json({ success: false, message: 'All cart items must belong to one shopkeeper' });
        }

        const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.variant.sellingPrice) * item.quantity), 0);
        let discountAmount = 0;
        let couponCode = null;

        if (cart.coupon) {
            const validation = isCouponValid(cart.coupon, subtotal);
            if (!validation.valid) {
                return res.status(400).json({ success: false, message: validation.message });
            }
            discountAmount = calculateCouponDiscount(cart.coupon, subtotal);
            couponCode = cart.coupon.code;
        }

        if (paymentType === 'COD') {
            const order = await createOrderFromCart({
                customerId: req.customerid,
                addressId,
                paymentType,
                cart,
                subtotal,
                discountAmount
            });

            return res.json({
                success: true,
                type: 'COD',
                order
            });
        }
        else {
            const razorpayOrder =
                await razorpayInstance.orders.create({
                    amount: Math.round(subtotal * 100),
                    currency: 'INR',
                    receipt: `receipt_${Date.now()}`
                });

            return res.json({
                success: true,
                type: 'ONLINE',
                razorpayOrder,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            });
        }

        return res.json({ success: true, order: created });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

customerCartRouter.post(
    '/verify-checkout',
    customerMiddleware,
    async (req, res) => {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            addressId
        } = req.body;

        try {


            const body =
                razorpay_order_id +
                "|" +
                razorpay_payment_id;

            const expectedSignature = crypto
                .createHmac(
                    'sha256',
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(body.toString())
                .digest('hex');

            if (
                expectedSignature !==
                razorpay_signature
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid signature'
                });
            }


            const payment =
                await razorpayInstance.payments.fetch(
                    razorpay_payment_id
                );

            if (payment.status !== 'captured') {
                return res.status(400).json({
                    success: false,
                    message: 'Payment not captured'
                });
            }


            const cart = await loadCart(
                req.customerid
            );

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart empty'
                });
            }

            const subtotal = cart.items.reduce(
                (sum, item) =>
                    sum +
                    Number(item.variant.sellingPrice) *
                    item.quantity,
                0
            );

            let discountAmount = 0;

            if (cart.coupon) {
                discountAmount =
                    calculateCouponDiscount(
                        cart.coupon,
                        subtotal
                    );
            }

            const finalAmount =
                subtotal - discountAmount;

            // amount verify

            if (
                payment.amount !==
                Math.round(finalAmount * 100)
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount mismatch'
                });
            }


            const order =
                await createOrderFromCart({
                    customerId: req.customerid,
                    addressId,
                    paymentType: 'ONLINE',
                    cart,
                    subtotal,
                    discountAmount,

                    paymentData: {
                        razorpay_order_id,
                        razorpay_payment_id,
                        razorpay_signature
                    }
                });

            return res.json({
                success: true,
                order
            });

        } catch (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: 'Internal Server Error'
            });
        }
    }
);