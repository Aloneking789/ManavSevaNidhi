import { Router } from "express";
import { prisma } from '../../config/prismaConfig.js';
import { customerMiddleware } from "../../middlewares/customerAuth.js";

export const wishlistRouter = Router();

function parsePositiveInt(value, fallback = 1) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function getCustomerUserId(customerId) {
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { userid: true }
    });

    if (!customer) {
        throw new Error('Customer not found');
    }

    return customer.userid;
}

async function loadWishlist(userId) {
    return prisma.wishlist.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: { select: { id: true, title: true, slug: true, images: true, categoryId: true, shopkeeperId: true } },
                    variant: { select: { id: true, name: true, sku: true, mrp: true, sellingPrice: true, stockQty: true, isActive: true } }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });
}

function shapeWishlist(wishlist) {
    if (!wishlist) {
        return { id: null, items: [], itemCount: 0 };
    }

    return {
        id: wishlist.id,
        items: wishlist.items.map((item) => ({
            id: item.id,
            createdAt: item.createdAt,
            product: item.product,
            variant: item.variant
        })),
        itemCount: wishlist.items.length
    };
}

async function getOrCreateWishlist(userId) {
    return prisma.wishlist.upsert({
        where: { userId },
        update: {},
        create: { userId },
        include: {
            items: {
                include: {
                    product: { select: { id: true, title: true, slug: true, images: true, categoryId: true, shopkeeperId: true } },
                    variant: { select: { id: true, name: true, sku: true, mrp: true, sellingPrice: true, stockQty: true, isActive: true } }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });
}

wishlistRouter.get('/', customerMiddleware, async (req, res) => {
    try {
        const userId = await getCustomerUserId(req.customerid);
        const wishlist = await loadWishlist(userId);
        return res.json({ success: true, wishlist: shapeWishlist(wishlist) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

wishlistRouter.post('/', customerMiddleware, async (req, res) => {
    const { productId, variantId } = req.body;
    if (!productId) {
        return res.status(400).json({ success: false, message: 'productId is required' });
    }

    try {
        const userId = await getCustomerUserId(req.customerid);
        const product = await prisma.item.findFirst({ where: { id: productId, isActive: true }, select: { id: true } });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        let resolvedVariantId = null;
        if (variantId) {
            const variant = await prisma.productVariant.findFirst({
                where: { id: variantId, productId, isActive: true },
                select: { id: true }
            });
            if (!variant) {
                return res.status(404).json({ success: false, message: 'Variant not found' });
            }
            resolvedVariantId = variant.id;
        }

        const wishlist = await getOrCreateWishlist(userId);
        await prisma.wishlistItem.upsert({
            where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
            update: { variantId: resolvedVariantId },
            create: { wishlistId: wishlist.id, productId, variantId: resolvedVariantId }
        });

        const updated = await loadWishlist(userId);
        return res.status(201).json({ success: true, wishlist: shapeWishlist(updated) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

wishlistRouter.delete('/items/:id', customerMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const userId = await getCustomerUserId(req.customerid);
        const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found' });
        }

        const item = await prisma.wishlistItem.findFirst({ where: { id, wishlistId: wishlist.id } });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Wishlist item not found' });
        }

        await prisma.wishlistItem.delete({ where: { id } });
        const updated = await loadWishlist(userId);
        return res.json({ success: true, wishlist: shapeWishlist(updated) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

wishlistRouter.post('/move-to-cart', customerMiddleware, async (req, res) => {
    const { wishlistItemId, productId, variantId, quantity = 1 } = req.body;

    try {
        const userId = await getCustomerUserId(req.customerid);
        const qty = parsePositiveInt(quantity);
        const wishlist = await prisma.wishlist.findUnique({
            where: { userId },
            include: { items: { include: { product: true, variant: true } } }
        });

        if (!wishlist || wishlist.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Wishlist is empty' });
        }

        const wishlistItem = wishlistItemId
            ? wishlist.items.find((item) => item.id === wishlistItemId)
            : wishlist.items.find((item) => item.productId === productId);

        if (!wishlistItem) {
            return res.status(404).json({ success: false, message: 'Wishlist item not found' });
        }

        const resolvedVariantId = variantId || wishlistItem.variantId;
        if (!resolvedVariantId) {
            return res.status(400).json({ success: false, message: 'variantId is required to move this item to cart' });
        }

        const product = await prisma.item.findFirst({ where: { id: wishlistItem.productId, isActive: true }, select: { id: true } });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const variant = await prisma.productVariant.findFirst({
            where: { id: resolvedVariantId, productId: wishlistItem.productId, isActive: true },
            select: { id: true, stockQty: true }
        });
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        const cart = await prisma.cart.upsert({
            where: { userId },
            update: {},
            create: { userId }
        });

        const existingCartItem = await prisma.cartItem.findUnique({
            where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } }
        });

        const nextQuantity = (existingCartItem?.quantity || 0) + qty;
        if (nextQuantity > variant.stockQty) {
            return res.status(400).json({ success: false, message: 'Insufficient stock for this variant' });
        }

        const result = await prisma.$transaction(async (tx) => {
            await tx.cartItem.upsert({
                where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
                update: { quantity: nextQuantity },
                create: { cartId: cart.id, productId: wishlistItem.productId, variantId: variant.id, quantity: qty }
            });

            await tx.wishlistItem.delete({ where: { id: wishlistItem.id } });

            const cartData = await tx.cart.findUnique({
                where: { id: cart.id },
                include: {
                    items: {
                        include: {
                            product: { select: { id: true, title: true, images: true, slug: true, categoryId: true, shopkeeperId: true } },
                            variant: { select: { id: true, name: true, sku: true, mrp: true, sellingPrice: true, stockQty: true, lowStockAlert: true, isActive: true, productId: true } }
                        }
                    }
                }
            });

            const wishlistData = await tx.wishlist.findUnique({
                where: { userId },
                include: {
                    items: {
                        include: {
                            product: { select: { id: true, title: true, slug: true, images: true, categoryId: true, shopkeeperId: true } },
                            variant: { select: { id: true, name: true, sku: true, mrp: true, sellingPrice: true, stockQty: true, isActive: true } }
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });

            return {
                cart: cartData,
                wishlist: wishlistData
            };
        });

        const cartItems = result.cart.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            product: item.product,
            variant: item.variant,
            lineTotal: Number(item.variant.sellingPrice) * item.quantity
        }));

        return res.json({
            success: true,
            message: 'Item moved to cart',
            cart: {
                id: result.cart.id,
                items: cartItems,
                subtotal: cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
                itemCount: cartItems.length
            },
            wishlist: shapeWishlist(result.wishlist)
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});