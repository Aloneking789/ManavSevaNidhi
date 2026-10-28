import { Router } from "express";
import { prisma } from '../../config/prismaConfig.js';
import { customerMiddleware } from "../../middlewares/customerAuth.js";

export const customerReviewsRouter = Router();

function parseImageUrls(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [value];
        } catch {
            return [value];
        }
    }
    return [];
}


customerReviewsRouter.get('/', async (req, res) => {

    try {

        const { productId, variantId } = req.query;

        const where = {
            status: 'APPROVED'
        };

        if (productId) {
            where.productId = String(productId);
        }

        if (variantId) {
            where.variantId = String(variantId);
        }

        const reviews = await prisma.review.findMany({
            where,

            orderBy: {
                createdAt: 'desc'
            },

            include: {

                product: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        images: true
                    }
                },

                variant: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        mrp: true,
                        sellingPrice: true
                    }
                },

                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        profileimage: true
                    }
                }
            }
        });

        return res.json({
            success: true,
            reviews
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });

    }

});

customerReviewsRouter.post(
    '/',
    customerMiddleware,
    async (req, res) => {

        const {
            productId,
            variantId,
            rating,
            description,
            title,
            orderId,
            imageUrls
        } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'productId is required'
            });
        }

        if (!variantId) {
            return res.status(400).json({
                success: false,
                message: 'variantId is required'
            });
        }

        const parsedRating = Number.parseInt(rating, 10);

        if (
            !Number.isInteger(parsedRating) ||
            parsedRating < 1 ||
            parsedRating > 5
        ) {
            return res.status(400).json({
                success: false,
                message: 'rating must be between 1 and 5'
            });
        }

        // if (
        //     !description ||
        //     !String(description).trim()
        // ) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'description is required'
        //     });
        // }

        try {

            const customer =
                await prisma.customer.findUnique({
                    where: {
                        id: req.customerid
                    },

                    select: {
                        id: true,
                        userid: true
                    }
                });

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            // =========================
            // CHECK PRODUCT + VARIANT
            // =========================

            const variant =
                await prisma.productVariant.findFirst({
                    where: {
                        id: variantId,
                        productId,
                        isActive: true
                    },

                    include: {
                        product: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                });

            if (!variant) {
                return res.status(404).json({
                    success: false,
                    message: 'Variant not found'
                });
            }

            // =========================
            // DUPLICATE REVIEW CHECK
            // =========================

            const existingReview =
                await prisma.review.findFirst({
                    where: {
                        variantId,
                        userId: customer.userid
                    }
                });

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message:
                        'You already reviewed this variant'
                });
            }

            let isVerified = false;

            let resolvedOrderId = orderId || null;

            // =========================
            // PURCHASE VERIFICATION
            // =========================

            if (resolvedOrderId) {

                const order =
                    await prisma.order.findFirst({
                        where: {
                            id: resolvedOrderId,
                            customerId: customer.id
                        },

                        include: {
                            orderItems: {
                                select: {
                                    productId: true,
                                    variantId: true
                                }
                            }
                        }
                    });

                if (!order) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid orderId'
                    });
                }

                const purchased =
                    order.orderItems.some(
                        (item) =>
                            item.productId === productId &&
                            item.variantId === variantId
                    );

                if (!purchased) {
                    return res.status(400).json({
                        success: false,
                        message:
                            'This order does not contain this variant'
                    });
                }

                isVerified = true;
            }

            // =========================
            // CREATE REVIEW
            // =========================

            const review =
                await prisma.review.create({

                    data: {

                        productId,

                        variantId,

                        userId: customer.userid,

                        orderId: resolvedOrderId,

                        rating: parsedRating,

                        title: title || null,

                        ...(description ? { body: String(description).trim() } : {}),

                        imageUrls:
                            parseImageUrls(imageUrls),

                        status: 'APPROVED',

                        isVerified
                    },

                    include: {

                        product: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                images: true
                            }
                        },

                        variant: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                mrp: true,
                                sellingPrice: true
                            }
                        },

                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                                profileimage: true
                            }
                        }
                    }
                });

            return res.status(201).json({
                success: true,
                review
            });

        } catch (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: 'Something went wrong'
            });

        }

    }
);