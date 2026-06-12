import { Router } from "express";
import { prisma } from '../../config/prismaConfig.js';
import { customerMiddleware } from "../../middlewares/customerAuth.js";


export const customerInventoryRouter = Router();

const publicCategorySelect = {
    id: true,
    title: true,
    slug: true,
    description: true,
    imageUrl: true,
    bannerUrl: true,
    parentId: true,
    isActive: true,
    sortOrder: true,
    metaTitle: true,
    metaDesc: true,
    createdAt: true
};

const publicItemSelect = {

    id: true,

    title: true,

    slug: true,

    images: true,

    availability: true,

    unit: true,

    shortDescription: true,

    description: true,

    warranty: true,

    addons: true,

    tags: true,

    isFeatured: true,

    isBestSeller: true,

    createdAt: true,

    categoryId: true,

    category: {
        select: {
            id: true,
            title: true,
            slug: true,
            imageUrl: true,
            bannerUrl: true,
            parentId: true
        }
    },

    // ONLY REQUIRED FOR PRICE CALCULATION

    variants: {

        where: {
            isActive: true
        },

        select: {
            sellingPrice: true,
            mrp: true
        }
    }
};


customerInventoryRouter.get(
    '/items',

    (req, res, next) => {

        if (req.headers.authorization) {
            return customerMiddleware(
                req,
                res,
                next
            );
        }

        next();

    },

    async (req, res) => {

        try {

            const items =
                await prisma.item.findMany({

                    where: {
                        isActive: true
                    },

                    select: publicItemSelect
                });

            const formattedItems =
                items.map((item) => {

                    const prices =
                        item.variants.map(
                            (variant) =>
                                Number(
                                    variant.sellingPrice
                                )
                        );

                    const mrps =
                        item.variants.map(
                            (variant) =>
                                Number(variant.mrp)
                        );

                    const startingPrice =
                        prices.length > 0
                            ? Math.min(...prices)
                            : null;

                    const maxPrice =
                        prices.length > 0
                            ? Math.max(...prices)
                            : null;

                    const startingMrp =
                        mrps.length > 0
                            ? Math.min(...mrps)
                            : null;

                    const maxMrp =
                        mrps.length > 0
                            ? Math.max(...mrps)
                            : null;

                    // REMOVE VARIANTS FROM RESPONSE
                    delete item.variants;

                    return {

                        ...item,

                        startingPrice,

                        maxPrice,

                        startingMrp,

                        maxMrp
                    };
                });

            return res.status(200).json({
                success: true,
                items: formattedItems
            });

        } catch (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Something went wrong"
            });

        }
    }
);

customerInventoryRouter.get('/shop-Images', async (req, res) => {
    try {
        const shopImages = await prisma.shopkeeperImage.findMany({
            select: {
                id: true,
                imageurl: true,
                description: true,
                uploadedAt: true
            }
        });
        res.status(200).json({ success: true, shopImages });
    } catch (err) {

        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

customerInventoryRouter.get('/offers', async (req, res) => {
    try {
        const now = new Date();
        const offers = await prisma.offer.findMany({
            where: {
                isActive: true,
                startDate: { lte: now },
                OR: [
                    { endDate: null },
                    { endDate: { gte: now } }
                ]
            },
            select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                bannerUrl: true,
                discountType: true,
                discountValue: true,
                minQty: true,
                buyQty: true,
                getQty: true,
                startDate: true,
                endDate: true,
                applicableProductIds: true,
                applicableCategoryIds: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, offers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

customerInventoryRouter.get('/banners', async (req, res) => {
    try {
        const now = new Date();

        const [offers, categories] = await Promise.all([
            prisma.offer.findMany({
                where: {
                    isActive: true,
                    startDate: { lte: now },
                    OR: [
                        { endDate: null },
                        { endDate: { gte: now } }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    imageUrl: true,
                    bannerUrl: true,
                    discountType: true,
                    discountValue: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.category.findMany({
                where: {
                    isActive: true,
                    bannerUrl: { not: null }
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    imageUrl: true,
                    bannerUrl: true,
                    parentId: true,
                    sortOrder: true,
                    createdAt: true
                },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
            })
        ]);

        const banners = [
            ...offers.map((offer) => ({
                type: 'offer',
                id: offer.id,
                title: offer.title,
                description: offer.description,
                imageUrl: offer.imageUrl,
                bannerUrl: offer.bannerUrl,
                discountType: offer.discountType,
                discountValue: offer.discountValue,
                createdAt: offer.createdAt
            })),
            ...categories.map((category) => ({
                type: 'category',
                id: category.id,
                title: category.title,
                slug: category.slug,
                imageUrl: category.imageUrl,
                bannerUrl: category.bannerUrl,
                parentId: category.parentId,
                sortOrder: category.sortOrder,
                createdAt: category.createdAt
            }))
        ];

        res.status(200).json({ success: true, banners });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});


// customerInventoryRouter.get('/item/:id', (req, res, next) => {
//     if (req.headers.authorization) {
//         return customerMiddleware(req, res, next);
//     }
//     next();
// }, async (req, res) => {
//     const { id } = req.params;
//     try {

//         let customer = null;

//         const item = await prisma.item.findFirst({
//             where: { id, isActive: true },
//             include: {
//                 variants: {
//                     select: {
//                         id: true,
//                         name: true,
//                         sku: true,
//                         mrp: true,
//                         sellingPrice: true,
//                         costPrice: true,
//                         weight: true,
//                         volume: true,
//                         lowStockAlert: true,
//                         isDefault: true,
//                         isActive: true,
//                         sortOrder: true,
//                         reviews: {
//                             where : {
//                                 status : "APPROVED"
//                             },
//                             select: {
//                                 rating: true,
//                                 body: true,
//                                 user: {
//                                     select: {
//                                         name: true
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 },
//                 category: {
//                     select: {
//                         id: true,
//                         title: true,
//                         slug: true,
//                         description: true,
//                         imageUrl: true,
//                         bannerUrl: true,
//                         parentId: true,
//                         isActive: true,
//                         sortOrder: true,
//                         metaTitle: true,
//                         metaDesc: true,
//                         createdAt: true
//                     }
//                 }
//             }
//         });
//         if (!item) return res.status(404).json({ success: false, message: "Item not found" });
//         res.status(200).json({ success: true, item });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, message: "Something went wrong" });
//     }
// });
customerInventoryRouter.get(
    '/item/:id',

    (req, res, next) => {

        if (req.headers.authorization) {
            return customerMiddleware(req, res, next);
        }

        next();

    },

    async (req, res) => {

        const { id } = req.params;

        try {

            const item =
                await prisma.item.findFirst({

                    where: {
                        id,
                        isActive: true
                    },

                    include: {

                        variants: {

                            include: {

                                reviews: {

                                    where: {
                                        status: 'APPROVED'
                                    },

                                    select: {

                                        rating: true,

                                        body: true,

                                        user: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        },

                        category: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                description: true,
                                imageUrl: true,
                                bannerUrl: true,
                                parentId: true,
                                isActive: true,
                                sortOrder: true,
                                metaTitle: true,
                                metaDesc: true,
                                createdAt: true
                            }
                        }
                    }
                });

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: "Item not found"
                });
            }

            // =========================
            // VARIANT AVG RATING
            // =========================

            item.variants = item.variants.map(
                (variant) => {

                    const totalReviews =
                        variant.reviews.length;

                    const averageRating =
                        totalReviews > 0
                            ? Number(
                                (
                                    variant.reviews.reduce(
                                        (sum, review) =>
                                            sum +
                                            review.rating,
                                        0
                                    ) / totalReviews
                                ).toFixed(1)
                            )
                            : null;

                    return {

                        ...variant,

                        averageRating,

                        totalReviews
                    };
                }
            );

            return res.status(200).json({
                success: true,
                item
            });

        } catch (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Something went wrong"
            });

        }
    }
);


customerInventoryRouter.get('/categories', (req, res, next) => {
    if (req.headers.authorization) {
        return customerMiddleware(req, res, next);
    }
    next();
}, async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            select: publicCategorySelect
        });
        res.status(200).json({ success: true, categories });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

customerInventoryRouter.get('/category/:categoryId/subcategories', (req, res, next) => {
    if (req.headers.authorization) {
        return customerMiddleware(req, res, next);
    }
    next();
}, async (req, res) => {
    const { categoryId } = req.params;
    try {
        const parent = await prisma.category.findUnique({
            where: { id: categoryId },
            select: publicCategorySelect
        });

        if (!parent || !parent.isActive) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const subcategories = await prisma.category.findMany({
            where: { parentId: categoryId, isActive: true },
            select: publicCategorySelect,
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
        });

        res.status(200).json({ success: true, category: parent, subcategories });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

customerInventoryRouter.get('/category/:categoryId/items', (req, res, next) => {
    if (req.headers.authorization) {
        return customerMiddleware(req, res, next);
    }
    next();
}, async (req, res) => {
    const { categoryId } = req.params;
    try {

        // customer context not needed for category item listing
        let customer = null;

        const items = await prisma.item.findMany({
            where: { categoryId, isActive: true },
            select: publicItemSelect
        });
        res.status(200).json({ success: true, items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});