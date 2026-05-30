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
        const { productId } = req.query;
        const where = { status: 'APPROVED' };
        if (productId) {
            where.productId = String(productId);
        }

        const reviews = await prisma.review.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                product: { select: { id: true, title: true, slug: true, images: true } },
                user: { select: { id: true, name: true, avatar: true, profileimage: true } }
            }
        });

        return res.json({ success: true, reviews });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

customerReviewsRouter.post('/', customerMiddleware, async (req, res) => {
    const { productId, rating, description, title, orderId, imageUrls } = req.body;

    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });
    const parsedRating = Number.parseInt(rating, 10);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
    }
    if (!description || !String(description).trim()) {
        return res.status(400).json({ success: false, message: 'description is required' });
    }

    try {
        const customer = await prisma.customer.findUnique({
            where: { id: req.customerid },
            select: { id: true, userid: true }
        });
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        const product = await prisma.item.findFirst({ where: { id: productId, isActive: true }, select: { id: true } });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const existingReview = await prisma.review.findFirst({
            where: { productId, userId: customer.userid }
        });
        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
        }

        let isVerified = false;
        let resolvedOrderId = orderId || null;
        if (resolvedOrderId) {
            const order = await prisma.order.findFirst({
                where: { id: resolvedOrderId, customerId: customer.id },
                include: { orderItems: { select: { productId: true } } }
            });
            if (!order) {
                return res.status(400).json({ success: false, message: 'Invalid orderId' });
            }
            const purchased = order.orderItems.some((item) => item.productId === productId);
            if (!purchased) {
                return res.status(400).json({ success: false, message: 'This order does not contain the selected product' });
            }
            isVerified = true;
        }

        const review = await prisma.review.create({
            data: {
                productId,
                userId: customer.userid,
                orderId: resolvedOrderId,
                rating: parsedRating,
                title: title || null,
                body: String(description).trim(),
                imageUrls: parseImageUrls(imageUrls),
                status: 'APPROVED',
                isVerified
            },
            include: {
                product: { select: { id: true, title: true, slug: true, images: true } },
                user: { select: { id: true, name: true, avatar: true, profileimage: true } }
            }
        });

        return res.status(201).json({ success: true, review });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});