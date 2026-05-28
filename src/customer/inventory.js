import { Router } from "express";
import { prisma } from '../../config/prismaConfig.js';
import { customerMiddleware } from "../../middlewares/customerAuth.js";


export const customerInventoryRouter = Router();

customerInventoryRouter.get('/items', (req, res, next) => {
    if (req.headers.authorization) {
        return customerMiddleware(req, res, next);
    }
    next();
}, async (req, res) => {
    try {

        let customer = null;
        if (req.customerid) {
            customer = await prisma.customer.findUnique({
                where: { id: req.customerid },
                select: { type: true }
            });
        }

        const items = await prisma.item.findMany({
            where: { isActive: true },
            select: {
                id: true,
                title: true,
                slug: true,
                availability: true,
                categoryId: true,
                    category: { select: { id: true, title: true, imageUrl: true } },
                unit: true,
                shortDescription: true,
                description: true,
                warranty: true,
                addons: true,
                tags: true,
                images: true,
                minimumpurchase: true,
                isFeatured: true,
                isBestSeller: true,
                createdAt: true
            }
        });
        res.status(200).json({ success: true, items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

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


customerInventoryRouter.get('/item/:id', (req, res, next) => {
    if (req.headers.authorization) {
        return customerMiddleware(req, res, next);
    }
    next();
}, async (req, res) => {
    const { id } = req.params;
    try {

        let customer = null;
        if (req.customerid) {
            customer = await prisma.customer.findUnique({
                where: { id: req.customerid },
                select: { type: true }
            });
        }

        const item = await prisma.item.findFirst({
            where: { id, isActive: true },
            include: {
                variants: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        mrp: true,
                        sellingPrice: true,
                        costPrice: true,
                        weight: true,
                        volume: true,
                        stockQty: true,
                        lowStockAlert: true,
                        isDefault: true,
                        isActive: true,
                        sortOrder: true
                    }
                },
                shopkeeper: {
                    select: {
                        shopname: true,
                        shopaddress: {
                            select: {
                                city: true,
                                state: true,
                                pincode: true,
                                flatnumber: true
                            }
                        }
                    }
                },
                category: { select: { id: true, title: true, imageUrl: true } }
            }
        });
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });
        res.status(200).json({ success: true, item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});



customerInventoryRouter.get('/categories', (req, res, next) => {
    if (req.headers.authorization) {
        return customerMiddleware(req, res, next);
    }
    next();
}, async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                title: true,
                imageUrl: true,
                bannerUrl: true,
                slug: true,
                parentId: true,
                isActive: true,
                sortOrder: true,
                createdAt: true
            }
        });
        res.status(200).json({ success: true, categories });
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

        let customer = null;
        if (req.customerid) {
            customer = await prisma.customer.findUnique({
                where: { id: req.customerid },
                select: { type: true }
            });
        }

        const items = await prisma.item.findMany({
            where: { categoryId, isActive: true },
            select: {
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
                minimumpurchase: true,
                isFeatured: true,
                isBestSeller: true,
                createdAt: true
            }
        });
        res.status(200).json({ success: true, items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});