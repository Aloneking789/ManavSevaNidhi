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
    minimumpurchase: true,
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
    }
};

customerInventoryRouter.get('/items', (req, res, next) => {
    if (req.headers.authorization) {
        return customerMiddleware(req, res, next);
    }
    next();
}, async (req, res) => {
    try {

        // customer info not required for public listing
        let customer = null;

        const items = await prisma.item.findMany({
            where: { isActive: true },
            select: publicItemSelect
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

        // customer context not needed for single item fetch
        let customer = null;

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