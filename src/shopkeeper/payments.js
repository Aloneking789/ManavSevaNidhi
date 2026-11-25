import { Router } from "express";
import { prisma } from "../../config/prismaConfig.js";
import { shopkeeperMiddleware } from "../../middlewares/shopkeeperAuth.js";

export const shopkeeperPaymentsRouter = Router();

shopkeeperPaymentsRouter.get("/", shopkeeperMiddleware, async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const orderId = typeof req.query.orderId === "string" && req.query.orderId.trim()
        ? req.query.orderId.trim()
        : undefined;
    const where = {
        order: { is: { shopkeeperId: req.shopkeeperid } },
        ...(orderId ? { orderId } : {})
    };

    try {
        const [total, payments] = await Promise.all([
            prisma.payment.count({ where }),
            prisma.payment.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    orderId: true,
                    status: true,
                    method: true,
                    amount: true,
                    currency: true,
                    gatewayOrderId: true,
                    gatewayPaymentId: true,
                    paidAt: true,
                    refundedAmount: true,
                    refundedAt: true,
                    refundReference: true,
                    createdAt: true,
                    updatedAt: true,
                    order: {
                        select: {
                            id: true,
                            status: true,
                            paymentType: true,
                            grandTotal: true,
                            createdAt: true,
                            customer: {
                                select: {
                                    user: { select: { name: true } }
                                }
                            },
                            orderItems: {
                                select: {
                                    productName: true,
                                    variantName: true,
                                    quantity: true,
                                    total: true
                                }
                            }
                        }
                    }
                }
            })
        ]);

        return res.json({
            success: true,
            payments,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error("Fetch shopkeeper payments error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch payment transactions" });
    }
});
