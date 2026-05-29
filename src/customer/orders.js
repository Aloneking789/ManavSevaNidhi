import { Router } from "express";
import { prisma } from '../../config/prismaConfig.js' // adjust path if different
import { customerMiddleware } from "../../middlewares/customerAuth.js";

export const customerOrdersRouter = Router();

customerOrdersRouter.post('/', customerMiddleware, async (req, res) => {
    console.log(`Customer ${req.customerid} is placing an order with data:`, req.body);
    const { items, paymentType, addressId } = req.body;
    if (!addressId) return res.status(400).json({ success: false, message: "addressId required" });
    if (!Array.isArray(items) || items.length === 0)
        return res.status(400).json({ success: false, message: "items required" });
    if (!paymentType || !["COD", "CASH"].includes(paymentType))
        return res.status(400).json({ success: false, message: "invalid paymentType" });

    try {
        const customer = await prisma.customer.findUnique({
            where: { id: req.customerid },
            select: { id: true }
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
                images: true
            }
        });
        if (dbItems.length !== itemIds.length)
            return res.status(400).json({ success: false, message: "Some items not found" });

        const shopkeeperSet = new Set(dbItems.map(i => i.shopkeeperId));
        if (shopkeeperSet.size !== 1)
            return res.status(400).json({ success: false, message: "All items must belong to same shopkeeper" });
        const shopkeeperId = dbItems[0].shopkeeperId;

        // Fetch any variants referenced by client
        const variantIds = [...new Set(items.map(i => i.variantId).filter(Boolean))];
        const dbVariants = variantIds.length ? await prisma.productVariant.findMany({ where: { id: { in: variantIds } }, select: { id: true, mrp: true, sellingPrice: true, productId: true, name: true, sku: true, stockQty: true, product: { select: { id: true, title: true, images: true } } } }) : [];
        const variantMap = new Map(dbVariants.map(v => [v.id, v]));

        let total = 0;
        const orderItemsData = [];
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
                lineTotal,
                total: lineTotal,
                variantId: reqItem.variantId,
                productName: dbItem.title,
                variantName: foundVariant.name,
                sku: foundVariant.sku,
                imageUrl: dbItem.images?.[0] || null
            });
        }

        const created = await prisma.order.create({
            data: {
                customerId: customer.id,
                shopkeeperId,
                paymentType,
                grandTotal: total,
                deliveryAddressId: addressId,
                orderItems: { create: orderItemsData }
            },
            include: {
                orderItems: { include: { item: { select: { title: true, unit: true } }, variant: { select: { name: true, mrp: true, sellingPrice: true, sku: true } } } },
                deliveryAddress: { select: { city: true, state: true, pincode: true, flatnumber: true, latitude: true, longitude: true } }
            }
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
customerOrdersRouter.get('/', customerMiddleware, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { customerId: req.customerid },
            orderBy: { createdAt: 'desc' },
            include: {
                orderItems: {
                    include: {
                        item: { select: { title: true, images: true } }
                    }
                },
                shopkeeper: { select: { shopname: true } },
                deliveryAddress: { select: { city: true, state: true, pincode: true, flatnumber: true, latitude: true, longitude: true } }
            }
        });

        // Trim to only needed fields
        const shaped = orders.map(o => ({
            id: o.id,
            paymentType: o.paymentType,
            grandTotal: o.grandTotal,
            status: o.status,
            createdAt: o.createdAt,
            orderItems: o.orderItems.map(oi => ({
                id: oi.id,
                quantity: oi.quantity,
                mrp: oi.mrp,
                sellingPrice: oi.sellingPrice,
                total: oi.total,
                variant: oi.variant,
                item: oi.item
            })),
            shopkeeper: o.shopkeeper,
            deliveryAddress: o.deliveryAddress
        }));

        res.json({ success: true, orders: shaped });
    } catch (err) {
        console.log(err);
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
            data: { status: 'CANCELLED' }
        });

        res.json({ success: true, message: "Order cancelled successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});