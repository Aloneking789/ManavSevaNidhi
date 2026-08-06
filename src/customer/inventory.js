import { Router } from "express";
import { prisma } from '../../config/prismaConfig.js';
import { customerMiddleware } from "../../middlewares/customerAuth.js";
import { getUserCartAndWishlistSets } from "./utils.js";



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

    featuredImage: true,

    availability: true,

    unit: true,

    shortDescription: true,

    description: true,

    warranty: true,

    addons: true,

    tags: true,

    howToUse: true,

    productHowToVidLink: true,

    productYtLink: true,

    isFeatured: true,

    isBestSeller: true,

    isBundle: true,

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

    //add seller information
    shopkeeper: {
        select: {
            id: true,
            shopname: true,
            shopaddress: {
                select: {
                    city: true,
                    state: true,
                    pincode: true
                }
            }
        }
    },


    // ONLY REQUIRED FOR PRICE CALCULATION

    variants: {

        where: {
            isActive: true
        },

        select: {

            id: true,

            name: true,

            images: true,

            sku: true,

            mrp: true,

            sellingPrice: true,

            stockQty: true,

            isDefault: true,

            averageRating: true,

            totalReviews: true
        }
    }
};


const getWatchAndShopProducts = async (req, res) => {
    try {
        const items = await prisma.item.findMany({
            where: {
                isActive: true,
                productYtLink: {
                    not: null,
                    notIn: ["", "null", "undefined"]
                }
            },
            select: {
                id: true,
                title: true,
                slug: true,
                productYtLink: true,
                featuredImage: true,
                images: true,
                variants: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        mrp: true,
                        sellingPrice: true,
                        stockQty: true,
                        isDefault: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Filter out empty or whitespace-only YouTube links
        const validItems = items.filter(item => item.productYtLink && String(item.productYtLink).trim().length > 0);

        const formattedItems = validItems.map((item) => {
            const defaultVariant = item.variants.find((variant) => variant.isDefault) || item.variants[0] || null;
            const featuredImg = item.featuredImage || (item.images && item.images.length > 0 ? item.images[0] : null);

            return {
                id: item.id,
                title: item.title,
                slug: item.slug,
                productYtLink: item.productYtLink,
                featuredImage: featuredImg,
                defaultVariant: defaultVariant ? {
                    id: defaultVariant.id,
                    name: defaultVariant.name,
                    mrp: defaultVariant.mrp,
                    sellingPrice: defaultVariant.sellingPrice,
                    stockQty: defaultVariant.stockQty
                } : null
            };
        });

        return res.status(200).json({
            success: true,
            count: formattedItems.length,
            items: formattedItems
        });
    } catch (err) {
        console.error('Watch and Shop error:', err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

customerInventoryRouter.get('/watch-and-shop', getWatchAndShopProducts);
customerInventoryRouter.get(
    '/items/search',
    (req, res, next) => {
        if (req.headers.authorization) {
            return customerMiddleware(req, res, next);
        }
        next();
    },
    async (req, res) => {

        try {

            const { userCartVariantIds, userWishlistVariantIds, userWishlistProductIds } = await getUserCartAndWishlistSets(req.customerid);

            const {
                q,
                limit = 20
            } = req.query;

            if (!q || !String(q).trim()) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Search query required"
                });
            }

            const search =
                String(q).trim();

            // =========================
            // ITEM SEARCH
            // =========================

            const matchedItems =
                await prisma.item.findMany({

                    where: {

                        isActive: true,

                        OR: [

                            {
                                title: {
                                    contains: search,
                                    mode: 'insensitive'
                                }
                            },

                            {
                                shortDescription: {
                                    contains: search,
                                    mode: 'insensitive'
                                }
                            },

                            {
                                description: {
                                    contains: search,
                                    mode: 'insensitive'
                                }
                            },

                            {
                                tags: {
                                    has: search
                                }
                            },

                            {
                                slug: {
                                    contains: search,
                                    mode: 'insensitive'
                                }
                            },

                            {
                                category: {
                                    title: {
                                        contains: search,
                                        mode: 'insensitive'
                                    }
                                }
                            }
                        ]
                    },

                    include: {

                        category: true,

                        variants: {

                            where: {
                                isActive: true
                            },

                            orderBy: {
                                sortOrder: 'asc'
                            }
                        }
                    },

                    take: Number(limit)
                });

            const itemResults =
                matchedItems.map(item => {
                    const mappedVariants = (item.variants || []).map(variant => {
                        const isAddedToCart = userCartVariantIds.has(variant.id);
                        const isAddedToWishlist = userWishlistVariantIds.has(variant.id) || userWishlistProductIds.has(item.id);
                        return {
                            ...variant,
                            isAddedToCart,
                            isAddedToWishlist
                        };
                    });

                    return {
                        ...item,
                        variants: mappedVariants,
                        matchedVariants: mappedVariants
                    };
                });

            return res.status(200).json({
                success: true,
                total: itemResults.length,
                items: itemResults
            });

        } catch (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message:
                    "Something went wrong"
            });

        }
    }
);

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

            const { userCartVariantIds, userWishlistVariantIds, userWishlistProductIds } = await getUserCartAndWishlistSets(req.customerid);

            const {
                page,
                limit = 10,
                isBestSeller,
                isFeatured,
                isBundle,
                categoryId,
                search,
                q
            } = req.query;

            const where = {
                isActive: true
            };

            // Dynamic filter for isBestSeller
            if (isBestSeller !== undefined) {
                if (typeof isBestSeller === 'boolean') {
                    where.isBestSeller = isBestSeller;
                } else if (typeof isBestSeller === 'string') {
                    const lower = isBestSeller.toLowerCase().trim();
                    if (lower === 'true' || lower === '1') {
                        where.isBestSeller = true;
                    } else if (lower === 'false' || lower === '0') {
                        where.isBestSeller = false;
                    }
                }
            }

            // Dynamic filter for isFeatured
            if (isFeatured !== undefined) {
                if (typeof isFeatured === 'boolean') {
                    where.isFeatured = isFeatured;
                } else if (typeof isFeatured === 'string') {
                    const lower = isFeatured.toLowerCase().trim();
                    if (lower === 'true' || lower === '1') {
                        where.isFeatured = true;
                    } else if (lower === 'false' || lower === '0') {
                        where.isFeatured = false;
                    }
                }
            }

            // Dynamic filter for isBundle
            if (isBundle !== undefined) {
                if (typeof isBundle === 'boolean') {
                    where.isBundle = isBundle;
                } else if (typeof isBundle === 'string') {
                    const lower = isBundle.toLowerCase().trim();
                    if (lower === 'true' || lower === '1') {
                        where.isBundle = true;
                    } else if (lower === 'false' || lower === '0') {
                        where.isBundle = false;
                    }
                }
            }

            // Dynamic filter for categoryId
            if (categoryId) {
                where.categoryId = String(categoryId);
            }

            // Dynamic filter for search / q
            const searchQuery = (search || q) ? String(search || q).trim() : null;
            if (searchQuery) {
                where.OR = [
                    { title: { contains: searchQuery, mode: 'insensitive' } },
                    { shortDescription: { contains: searchQuery, mode: 'insensitive' } },
                    { description: { contains: searchQuery, mode: 'insensitive' } },
                    { tags: { has: searchQuery } },
                    { slug: { contains: searchQuery, mode: 'insensitive' } }
                ];
            }

            // Calculate pagination
            const pageNum = Math.max(1, parseInt(page, 10) || 1);
            const limitNum = Math.max(1, parseInt(limit, 10) || 10);
            const skip = (pageNum - 1) * limitNum;

            const [totalItems, items] = await Promise.all([
                prisma.item.count({ where }),
                prisma.item.findMany({
                    where,
                    select: publicItemSelect,
                    skip,
                    take: limitNum,
                    orderBy: { createdAt: 'desc' }
                })
            ]);

            const totalPages = Math.ceil(totalItems / limitNum) || 1;

            const formattedItems = items.map((item) => {

                const defaultVariant =
                    item.variants.find(
                        variant => variant.isDefault
                    ) || item.variants[0] || null;

                let mappedDefaultVariant = null;
                if (defaultVariant) {
                    mappedDefaultVariant = {
                        ...defaultVariant,
                        isAddedToCart: userCartVariantIds.has(defaultVariant.id),
                        isAddedToWishlist: userWishlistVariantIds.has(defaultVariant.id) || userWishlistProductIds.has(item.id)
                    };
                }

                delete item.variants;

                return {
                    ...item,
                    defaultVariant: mappedDefaultVariant
                };
            });

            return res.status(200).json({
                success: true,
                totalItems,
                totalPages,
                currentPage: pageNum,
                limit: limitNum,
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage: pageNum,
                    limit: limitNum
                },
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

// customerInventoryRouter.get(
//     '/item/:id',

//     (req, res, next) => {

//         if (req.headers.authorization) {
//             return customerMiddleware(req, res, next);
//         }

//         next();

//     },

//     async (req, res) => {

//         const { id } = req.params;

//         try {

//             const item =
//                 await prisma.item.findFirst({

//                     where: {
//                         id,
//                         isActive: true
//                     },

//                     include: {

//                         variants: {

//                             include: {

//                                 reviews: {

//                                     where: {
//                                         status: 'APPROVED'
//                                     },

//                                     select: {

//                                         rating: true,

//                                         body: true,

//                                         user: {
//                                             select: {
//                                                 name: true
//                                             }
//                                         }
//                                     }
//                                 }
//                             }
//                         },

//                         category: {
//                             select: {
//                                 id: true,
//                                 title: true,
//                                 slug: true,
//                                 description: true,
//                                 imageUrl: true,
//                                 bannerUrl: true,
//                                 parentId: true,
//                                 isActive: true,
//                                 sortOrder: true,
//                                 metaTitle: true,
//                                 metaDesc: true,
//                                 createdAt: true
//                             }
//                         }
//                     }
//                 });

//             if (!item) {
//                 return res.status(404).json({
//                     success: false,
//                     message: "Item not found"
//                 });
//             }

//             // =========================
//             // VARIANT AVG RATING
//             // =========================

//             item.variants = item.variants.map(
//                 (variant) => {

//                     const totalReviews =
//                         variant.reviews.length;

//                     const averageRating =
//                         totalReviews > 0
//                             ? Number(
//                                 (
//                                     variant.reviews.reduce(
//                                         (sum, review) =>
//                                             sum +
//                                             review.rating,
//                                         0
//                                     ) / totalReviews
//                                 ).toFixed(1)
//                             )
//                             : null;

//                     return {

//                         ...variant,

//                         averageRating,

//                         totalReviews
//                     };
//                 }
//             );

//             return res.status(200).json({
//                 success: true,
//                 item
//             });

//         } catch (err) {

//             console.error(err);

//             return res.status(500).json({
//                 success: false,
//                 message: "Something went wrong"
//             });

//         }
//     }
// );

customerInventoryRouter.get(
    '/item/:id',
    (req, res, next) => {
        if (req.headers.authorization) {
            // Assuming this middleware attaches `req.customerid` and calls next()
            return customerMiddleware(req, res, next);
        }
        next();
    },
    async (req, res) => {
        const { id } = req.params;

        try {
            // 1. Fetch the Item with its relations
            const item = await prisma.item.findFirst({
                where: {
                    OR: [{ id }, { slug: id }],
                    isActive: true
                },
                include: {
                    faqs: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
                    sections: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
                    variants: {
                        include: {
                            reviews: {
                                where: { status: 'APPROVED' },
                                select: {
                                    rating: true,
                                    body: true,
                                    user: {
                                        select: { name: true }
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
                    },
                    shopkeeper: {
                        select: {
                            id: true,
                            shopname: true,
                            shopaddress: {
                                select: {
                                    id: true,
                                    city: true,
                                    state: true,
                                    pincode: true,
                                    flatnumber: true,
                                    latitude: true,
                                    longitude: true
                                }
                            },
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    phone: true,
                                    profileimage: true
                                }
                            }
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
            // CART & WISHLIST TRACKING
            // =========================
            const { userCartVariantIds, userWishlistVariantIds, userWishlistProductIds } = await getUserCartAndWishlistSets(req.customerid);

            // =========================
            // VARIANT MAPPING
            // =========================
            item.variants = item.variants.map((variant) => {
                // Ratings calculation
                const totalReviews = variant.reviews.length;
                const averageRating = totalReviews > 0
                    ? Number(
                        (
                            variant.reviews.reduce(
                                (sum, review) => sum + review.rating,
                                0
                            ) / totalReviews
                        ).toFixed(1)
                    )
                    : null;

                // Dynamic Cart & Wishlist Flags
                const isAddedToCart = userCartVariantIds.has(variant.id);
                // True if the specific variant is wishlisted OR if the whole product is wishlisted
                const isAddedToWishlist = userWishlistVariantIds.has(variant.id) || userWishlistProductIds.has(item.id);

                return {
                    ...variant,
                    averageRating,
                    totalReviews,
                    isAddedToCart,
                    isAddedToWishlist
                };
            });

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


customerInventoryRouter.get(

    '/category/:categoryId/items',

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

        const { categoryId } = req.params;

        try {

            const { userCartVariantIds, userWishlistVariantIds, userWishlistProductIds } = await getUserCartAndWishlistSets(req.customerid);

            const items =
                await prisma.item.findMany({

                    where: {

                        categoryId,

                        isActive: true
                    },

                    select: publicItemSelect
                });

            // =========================
            // FORMAT SAME AS /items
            // =========================

            const formattedItems =
                items.map((item) => {

                    const defaultVariant =
                        item.variants.find(
                            (variant) =>
                                variant.isDefault
                        ) || null;

                    let mappedDefaultVariant = null;
                    if (defaultVariant) {
                        mappedDefaultVariant = {
                            ...defaultVariant,
                            isAddedToCart: userCartVariantIds.has(defaultVariant.id),
                            isAddedToWishlist: userWishlistVariantIds.has(defaultVariant.id) || userWishlistProductIds.has(item.id)
                        };
                    }

                    delete item.variants;

                    return {

                        ...item,

                        defaultVariant: mappedDefaultVariant
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

                message:
                    "Something went wrong"
            });

        }
    }
);



