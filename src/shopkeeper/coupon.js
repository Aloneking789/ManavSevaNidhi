import { Router } from "express";
import { prisma } from '../../config/prismaConfig.js';
import { shopkeeperMiddleware } from "../../middlewares/shopkeeperAuth.js";

export const couponRouter = Router();

function parseOptionalDate(value) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeCouponBody(body) {
    const data = {};

    const fields = [
        'code', 'description', 'discountType', 'discountValue', 'minOrderAmount', 'maxDiscountAmount',
        'usageLimit', 'usageLimitPerUser', 'status', 'isFirstOrder', 'isAppOnly', 'applicableOn'
    ];

    for (const field of fields) {
        if (body[field] !== undefined) data[field] = body[field];
    }

    if (data.discountValue !== undefined) data.discountValue = Number(data.discountValue);
    if (data.minOrderAmount !== undefined) data.minOrderAmount = data.minOrderAmount === '' ? null : Number(data.minOrderAmount);
    if (data.maxDiscountAmount !== undefined) data.maxDiscountAmount = data.maxDiscountAmount === '' ? null : Number(data.maxDiscountAmount);
    if (data.usageLimit !== undefined) data.usageLimit = data.usageLimit === '' ? null : Number.parseInt(data.usageLimit, 10);
    if (data.usageLimitPerUser !== undefined) data.usageLimitPerUser = data.usageLimitPerUser === '' ? null : Number.parseInt(data.usageLimitPerUser, 10);
    if (data.isFirstOrder !== undefined) data.isFirstOrder = data.isFirstOrder === true || data.isFirstOrder === 'true';
    if (data.isAppOnly !== undefined) data.isAppOnly = data.isAppOnly === true || data.isAppOnly === 'true';
    if (data.applicableOn !== undefined) {
        if (typeof data.applicableOn === 'string') {
            try {
                data.applicableOn = JSON.parse(data.applicableOn);
            } catch {
                data.applicableOn = data.applicableOn.split(',').map((value) => value.trim()).filter(Boolean);
            }
        }
        if (!Array.isArray(data.applicableOn)) data.applicableOn = [];
    }

    return data;
}

couponRouter.get('/', shopkeeperMiddleware, async (req, res) => {
    try {
        const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
        return res.json({ success: true, coupons });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

couponRouter.get('/:id', shopkeeperMiddleware, async (req, res) => {
    try {
        const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        return res.json({ success: true, coupon });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

couponRouter.post('/', shopkeeperMiddleware, async (req, res) => {
    const data = normalizeCouponBody(req.body);
    if (data.discountType === 'FREE_SHIPPING' && data.discountValue === undefined) {
        data.discountValue = 0;
    }
    if (!data.code || !data.discountType || data.discountValue === undefined) {
        return res.status(400).json({ success: false, message: 'code, discountType and discountValue are required' });
    }

    try {
        const coupon = await prisma.coupon.create({
            data: {
                ...data,
                startDate: parseOptionalDate(req.body.startDate) || new Date(),
                endDate: parseOptionalDate(req.body.endDate) || null,
            }
        });
        return res.status(201).json({ success: true, coupon });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

couponRouter.put('/:id', shopkeeperMiddleware, async (req, res) => {
    try {
        const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ success: false, message: 'Coupon not found' });

        const data = normalizeCouponBody(req.body);
        if (req.body.startDate !== undefined) data.startDate = parseOptionalDate(req.body.startDate) || existing.startDate;
        if (req.body.endDate !== undefined) data.endDate = parseOptionalDate(req.body.endDate);

        const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data });
        return res.json({ success: true, coupon });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

couponRouter.delete('/:id', shopkeeperMiddleware, async (req, res) => {
    try {
        const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ success: false, message: 'Coupon not found' });

        await prisma.coupon.delete({ where: { id: req.params.id } });
        return res.json({ success: true, message: 'Coupon deleted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});