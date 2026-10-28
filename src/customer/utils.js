import { prisma } from '../../config/prismaConfig.js';

export async function getUserCartAndWishlistSets(customerId) {
    const userCartVariantIds = new Set();
    const userWishlistVariantIds = new Set();
    const userWishlistProductIds = new Set();

    if (customerId) {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { userid: true }
        });

        if (customer) {
            const userId = customer.userid;

            const [cart, wishlist] = await Promise.all([
                prisma.cart.findUnique({
                    where: { userId },
                    select: { items: { select: { variantId: true } } }
                }),
                prisma.wishlist.findUnique({
                    where: { userId },
                    select: { items: { select: { productId: true, variantId: true } } }
                })
            ]);

            if (cart) {
                cart.items.forEach(ci => {
                    if (ci.variantId) {
                        userCartVariantIds.add(ci.variantId);
                    }
                });
            }

            if (wishlist) {
                wishlist.items.forEach(wi => {
                    if (wi.productId) {
                        userWishlistProductIds.add(wi.productId);
                    }
                    if (wi.variantId) {
                        userWishlistVariantIds.add(wi.variantId);
                    }
                });
            }
        }
    }

    return { userCartVariantIds, userWishlistVariantIds, userWishlistProductIds };
}
