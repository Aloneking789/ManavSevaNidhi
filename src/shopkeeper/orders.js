import { Router } from "express";
import { prisma } from '../../config/prismaConfig.js';
import { shopkeeperMiddleware } from "../../middlewares/shopkeeperAuth.js";

export const shopkeeperOrdersRouter = Router();

function aggregateOrderQuantities(orderItems) {
  const quantities = new Map();
  for (const orderItem of orderItems) {
    quantities.set(orderItem.variantId, (quantities.get(orderItem.variantId) || 0) + orderItem.quantity);
  }
  return quantities;
}

async function loadShopkeeperOrder(shopkeeperId, orderId) {
  return prisma.order.findFirst({
    where: { id: orderId, shopkeeperId },
    include: {
      customer: {
        select: {
          id: true,
          user: { select: { id: true, name: true, phone: true, email: true, profileimage: true, avatar: true } }
        }
      },
      orderItems: {
        include: {
          item: { select: { title: true, unit: true, images: true } },
          variant: { select: { id: true, name: true, sku: true, mrp: true, sellingPrice: true, stockQty: true } }
        }
      },
      deliveryAddress: { select: { city: true, state: true, pincode: true, flatnumber: true } }
    }
  });
}

async function restockOrderVariants(tx, order) {
  const quantities = aggregateOrderQuantities(order.orderItems);
  for (const [variantId, quantity] of quantities.entries()) {
    await tx.productVariant.update({
      where: { id: variantId },
      data: { stockQty: { increment: quantity } }
    });
  }
}

async function reserveOrderVariants(tx, order) {
  const quantities = aggregateOrderQuantities(order.orderItems);

  for (const [variantId, quantity] of quantities.entries()) {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { stockQty: true, productId: true, isActive: true }
    });

    if (!variant || !variant.isActive) {
      throw new Error(`Variant ${variantId} is not available`);
    }

    if (variant.stockQty < quantity) {
      throw new Error(`Insufficient stock for variant ${variantId}`);
    }

    await tx.productVariant.update({
      where: { id: variantId },
      data: { stockQty: { decrement: quantity } }
    });
  }
}

async function transitionOrder(req, res, options) {
  const { id } = req.params;
  const {
    nextStatus,
    allowedFrom,
    reserveStock = false,
    restockStock = false,
    requireCancelReason = false,
    defaultCancelReason = null
  } = options;

  try {
    const order = await loadShopkeeperOrder(req.shopkeeperid, id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!allowedFrom.includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot move order from ${order.status} to ${nextStatus}` });
    }

    const cancelReason = req.body?.cancelReason || defaultCancelReason;
    if (requireCancelReason && !String(cancelReason || '').trim()) {
      return res.status(400).json({ success: false, message: 'cancelReason is required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      if (reserveStock) {
        await reserveOrderVariants(tx, order);
      }

      if (restockStock) {
        await restockOrderVariants(tx, order);
      }

      const updateData = { status: nextStatus };
      if (nextStatus === 'CANCELLED') {
        updateData.cancelledAt = new Date();
        updateData.cancelReason = String(cancelReason || '').trim();
      }

      return tx.order.update({
        where: { id: order.id },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              user: { select: { id: true, name: true, phone: true, email: true, profileimage: true, avatar: true } }
            }
          },
          orderItems: {
            include: {
              item: { select: { title: true, unit: true, images: true } },
              variant: { select: { id: true, name: true, sku: true, mrp: true, sellingPrice: true, stockQty: true } }
            }
          },
          deliveryAddress: { select: { city: true, state: true, pincode: true, flatnumber: true } }
        }
      });
    });

    return res.json({ success: true, order: result });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ success: false, message: err.message || 'Transition failed' });
  }
}

shopkeeperOrdersRouter.get('/', shopkeeperMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { shopkeeperId: req.shopkeeperid },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            user: { select: { id: true, name: true, phone: true, email: true, profileimage: true, avatar: true } }
          }
        },
        orderItems: {
          include: {
            item: { select: { title: true, unit: true, images: true } },
            variant: { select: { id: true, name: true, sku: true, mrp: true, sellingPrice: true, stockQty: true } }
          }
        },
        deliveryAddress: { select: { city: true, state: true, pincode: true, flatnumber: true } }
      }
    });

    res.json({ success: true, orders });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

shopkeeperOrdersRouter.patch('/:id/confirm', shopkeeperMiddleware, (req, res) =>
  transitionOrder(req, res, {
    nextStatus: 'CONFIRMED',
    allowedFrom: ['PROCESSING'],
    reserveStock: true
  }));

shopkeeperOrdersRouter.patch('/:id/accept', shopkeeperMiddleware, (req, res) =>
  transitionOrder(req, res, {
    nextStatus: 'CONFIRMED',
    allowedFrom: ['PROCESSING'],
    reserveStock: true
  }));

shopkeeperOrdersRouter.patch('/:id/ship', shopkeeperMiddleware, (req, res) =>
  transitionOrder(req, res, {
    nextStatus: 'SHIPPED',
    allowedFrom: ['CONFIRMED']
  }));

shopkeeperOrdersRouter.patch('/:id/delivery-pickup', shopkeeperMiddleware, (req, res) =>
  transitionOrder(req, res, {
    nextStatus: 'SHIPPED',
    allowedFrom: ['CONFIRMED']
  }));

shopkeeperOrdersRouter.patch('/:id/out-for-delivery', shopkeeperMiddleware, (req, res) =>
  transitionOrder(req, res, {
    nextStatus: 'OUT_FOR_DELIVERY',
    allowedFrom: ['SHIPPED']
  }));

shopkeeperOrdersRouter.patch('/:id/delivered', shopkeeperMiddleware, (req, res) =>
  transitionOrder(req, res, {
    nextStatus: 'DELIVERED',
    allowedFrom: ['OUT_FOR_DELIVERY']
  }));

shopkeeperOrdersRouter.patch('/:id/cancel', shopkeeperMiddleware, (req, res) =>
  transitionOrder(req, res, {
    nextStatus: 'CANCELLED',
    allowedFrom: ['PROCESSING', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY'],
    restockStock: true,
    requireCancelReason: true
  }));

shopkeeperOrdersRouter.patch('/:id/reject', shopkeeperMiddleware, (req, res) =>
  transitionOrder(req, res, {
    nextStatus: 'CANCELLED',
    allowedFrom: ['PROCESSING'],
    requireCancelReason: false,
    defaultCancelReason: 'Rejected by shopkeeper'
  }));