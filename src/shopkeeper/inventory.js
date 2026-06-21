import { Router } from "express";
import { prisma } from '../../config/prismaConfig.js';
import cloudinary from '../../config/cloudinary.js';
import multer from 'multer';
import { shopkeeperMiddleware } from "../../middlewares/shopkeeperAuth.js";

const upload = multer({ storage: multer.memoryStorage() });

export const inventoryRouter = Router();

// Helper to upload a single image buffer to cloudinary
async function uploadImageBuffer(buffer) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'buildmart' }, (err, result) => {
            if (err) return reject(err);
            resolve(result.secure_url);
        }).end(buffer);
    });
}

// Helper to upload multiple image buffers to cloudinary
async function uploadImageBuffers(files) {
    const urls = [];
    for (const file of files) {
        const url = await uploadImageBuffer(file.buffer);
        urls.push(url);
    }
    return urls;
}

// Simple slugify helper
function slugify(text) {
    return (text || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

// Ensure unique category slug
async function makeUniqueCategorySlug(title) {
    let base = slugify(title) || `cat-${Date.now()}`;
    let slug = base;
    let i = 1;
    while (await prisma.category.findUnique({ where: { slug } })) {
        slug = `${base}-${i++}`;
    }
    return slug;
}

// Ensure unique item slug
async function makeUniqueItemSlug(title) {
    let base = slugify(title) || `item-${Date.now()}`;
    let slug = base;
    let i = 1;
    while (await prisma.item.findUnique({ where: { slug } })) {
        slug = `${base}-${i++}`;
    }
    return slug;
}

// Simple SKU generator fallback
function genSku() {
    return `SKU-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
}

function getStockStatus(variant) {
    if (!variant || variant.stockQty <= 0) return 'OUT_OF_STOCK';
    if (variant.stockQty <= variant.lowStockAlert) return 'LOW_STOCK';
    return 'IN_STOCK';
}

function normalizeStockMovement(action) {
    const value = String(action || 'set').toLowerCase();
    if (value === 'increment' || value === 'add') return 'INCREMENT';
    if (value === 'decrement' || value === 'subtract' || value === 'deduct') return 'DECREMENT';
    if (value === 'adjustment') return 'ADJUSTMENT';
    return 'SET';
}

async function getInventoryVariants(shopkeeperid, filter) {
    const variants = await prisma.productVariant.findMany({
        where: {
            product: { shopkeeperId: shopkeeperid }
        },
        include: {
            product: { select: { id: true, title: true, slug: true, images: true } }
        },
        orderBy: [{ stockQty: 'asc' }, { createdAt: 'desc' }]
    });

    return variants
        .map((variant) => ({
            ...variant,
            stockStatus: getStockStatus(variant)
        }))
        .filter((variant) => {
            if (filter === 'low') return variant.stockStatus === 'LOW_STOCK';
            if (filter === 'high') return variant.stockStatus === 'IN_STOCK';
            if (filter === 'out' || filter === 'out_of_stock') return variant.stockStatus === 'OUT_OF_STOCK';
            return true;
        });
}

// Create a new category (with image file)
inventoryRouter.post('/category', shopkeeperMiddleware, upload.fields([{ name: 'image' }, { name: 'banner' }]), async (req, res) => {
    const { title, description, parentId, metaTitle, metaDesc, sortOrder } = req.body;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const shopkeeper = await prisma.shopkeeper.findUnique({ where: { id: shopkeeperid } });
        if (!shopkeeper) return res.status(404).json({ success: false, message: "Shopkeeper not found" });

        // if parentId provided, validate ownership
        if (parentId) {
            const parent = await prisma.category.findUnique({ where: { id: parentId } });
            if (!parent || parent.shopkeeperId !== shopkeeperid) return res.status(400).json({ success: false, message: 'Invalid parent category' });
        }

        const files = req.files || {};
        let imageUrl = undefined;
        let bannerUrl = undefined;
        if (files.image && files.image[0]) imageUrl = await uploadImageBuffer(files.image[0].buffer);
        if (files.banner && files.banner[0]) bannerUrl = await uploadImageBuffer(files.banner[0].buffer);

        const slug = await makeUniqueCategorySlug(title);
        const category = await prisma.category.create({
            data: {
                title,
                slug,
                description: description || undefined,
                imageUrl: imageUrl || undefined,
                bannerUrl: bannerUrl || undefined,
                parentId: parentId || undefined,
                metaTitle: metaTitle || undefined,
                metaDesc: metaDesc || undefined,
                sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
                shopkeeperId: shopkeeper.id
            }
        });
        res.status(201).json({ success: true, category });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

// Update category (title/image file)
inventoryRouter.put('/category/:id', shopkeeperMiddleware, upload.fields([{ name: 'image' }, { name: 'banner' }]), async (req, res) => {
    const { title, description, parentId, metaTitle, metaDesc, isActive, sortOrder } = req.body;
    const { id } = req.params;
    try {
        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ success: false, message: 'Category not found' });

        // check ownership
        const shopkeeperid = await req.shopkeeperid;
        if (existing.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized' });

        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (parentId !== undefined) updateData.parentId = parentId || null;
        if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
        if (metaDesc !== undefined) updateData.metaDesc = metaDesc;
        if (isActive !== undefined) updateData.isActive = !!isActive;
        if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);

        const files = req.files || {};
        if (files.image && files.image[0]) updateData.imageUrl = await uploadImageBuffer(files.image[0].buffer);
        if (files.banner && files.banner[0]) updateData.bannerUrl = await uploadImageBuffer(files.banner[0].buffer);

        if (title && updateData.slug === undefined) updateData.slug = await makeUniqueCategorySlug(title);

        const category = await prisma.category.update({ where: { id }, data: updateData });
        res.status(200).json({ success: true, category });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

// Delete category
inventoryRouter.delete('/category/:id', shopkeeperMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ success: false, message: 'Category not found' });
        const shopkeeperid = await req.shopkeeperid;
        if (existing.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized' });
        await prisma.category.delete({ where: { id } });
        res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
});

// Get single category with children
inventoryRouter.get('/category/:id', shopkeeperMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const category = await prisma.category.findUnique({ where: { id }, include: { children: true } });
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        res.json({ success: true, category });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

// Create subcategory under a parent id
inventoryRouter.post('/category/:parentId/subcategory', shopkeeperMiddleware, upload.fields([{ name: 'image' }, { name: 'banner' }]), async (req, res) => {
    const { parentId } = req.params;
    const { title, description, metaTitle, metaDesc, sortOrder } = req.body;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const parent = await prisma.category.findUnique({ where: { id: parentId } });
        if (!parent || parent.shopkeeperId !== shopkeeperid) return res.status(400).json({ success: false, message: 'Invalid parent category' });
        const files = req.files || {};
        let imageUrl = undefined;
        let bannerUrl = undefined;
        if (files.image && files.image[0]) imageUrl = await uploadImageBuffer(files.image[0].buffer);
        if (files.banner && files.banner[0]) bannerUrl = await uploadImageBuffer(files.banner[0].buffer);
        const slug = await makeUniqueCategorySlug(title);
        const category = await prisma.category.create({
            data: {
                title,
                slug,
                description: description || undefined,
                imageUrl: imageUrl || undefined,
                bannerUrl: bannerUrl || undefined,
                parentId: parentId,
                metaTitle: metaTitle || undefined,
                metaDesc: metaDesc || undefined,
                sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
                shopkeeperId: shopkeeperid
            }
        });
        res.status(201).json({ success: true, category });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to create subcategory' });
    }
});

// Get subcategories for a category
inventoryRouter.get('/category/:id/subcategories', shopkeeperMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const subs = await prisma.category.findMany({ where: { parentId: id } });
        res.json({ success: true, subcategories: subs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

// Add item under a category (with up to 5 image files)
inventoryRouter.post('/item', shopkeeperMiddleware, upload.any(), async (req, res) => {
    // Accepts file uploads (`images`) or JSON `images` array in body.
    const shopkeeperid = await req.shopkeeperid;
    const payload = req.body;
    console.log(payload)
    try {

        // if (!payload.variants || payload.variants.length === 0) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "At least one variant required"
        //     });
        // }

        const shopkeeper = await prisma.shopkeeper.findUnique({ where: { id: shopkeeperid } });
        if (!shopkeeper) return res.status(404).json({ success: false, message: "Shopkeeper not found" });

        // Determine images: uploaded files (preferred) or images array/string in body
        const files = req.files || [];

        // =========================
        // MAIN PRODUCT IMAGES
        // =========================

        const mainImageFiles =
            files.filter(
                file => file.fieldname === 'images'
            );

        let imageUrls = [];

        if (mainImageFiles.length > 0) {

            if (
                mainImageFiles.length < 1 ||
                mainImageFiles.length > 5
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "You must provide between 1 and 5 product images."
                });
            }

            imageUrls =
                await uploadImageBuffers(
                    mainImageFiles
                );
        }

        // =========================
        // VARIANT IMAGES MAP
        // =========================

        const variantImagesMap = {};

        // Example:
        // variantImages_0
        // variantImages_1

        const variantImageFields =
            files.filter(file =>
                file.fieldname.startsWith(
                    'variantImages_'
                )
            );

        for (const file of variantImageFields) {

            const match =
                file.fieldname.match(
                    /^variantImages_(\d+)$/
                );

            if (!match) continue;

            const variantIndex = match[1];

            if (!variantImagesMap[variantIndex]) {
                variantImagesMap[variantIndex] = [];
            }

            variantImagesMap[variantIndex].push(file);
        }

        // Upload all variant images

        const uploadedVariantImages = {};

        for (const index in variantImagesMap) {

            uploadedVariantImages[index] =
                await uploadImageBuffers(
                    variantImagesMap[index]
                );
        }

        // Validate category ownership if provided
        if (payload.categoryId) {
            const cat = await prisma.category.findUnique({ where: { id: payload.categoryId } });
            if (!cat || cat.shopkeeperId !== shopkeeperid) return res.status(400).json({ success: false, message: 'Invalid category' });
        }

        // Parse variants if provided (keeps original flexible handling)
        let variantsData = undefined;
        if (payload.variants) {
            try {
                variantsData = typeof payload.variants === 'string' ? JSON.parse(payload.variants) : payload.variants;
                if (!Array.isArray(variantsData)) return res.status(400).json({ success: false, message: 'Variants must be an array.' });
            } catch (e) {
                return res.status(400).json({ success: false, message: 'Invalid variants JSON.' });
            }
        }

        if (!variantsData || variantsData.length === 0) {

            return res.status(400).json({
                success: false,
                message:
                    "At least one variant is required"
            });
        }

        const defaultVariants =
            variantsData.filter(
                v => v.isDefault === true
            );

        if (defaultVariants.length === 0) {

            return res.status(400).json({
                success: false,
                message:
                    "One variant must be set as default"
            });
        }

        if (defaultVariants.length > 1) {

            return res.status(400).json({
                success: false,
                message:
                    "Only one variant can be default"
            });
        }

        // Build create data mapping newer product fields
        // ensure required fields for Prisma
        const slugVal = payload.slug || await makeUniqueItemSlug(payload.title || 'item-' + Date.now());
        const unitVal = payload.unit || 'OTHER';
        const descVal = payload.description || payload.longDescription || '';

        const createData = {
            title: payload.title || 'Untitled Product',
            slug: slugVal,
            unit: unitVal,
            description: descVal,
            minimumpurchase: payload.minimumpurchase !== undefined ? parseInt(payload.minimumpurchase) : (payload.minimumpurchase || 0),
            images: imageUrls,
            availability: payload.availability,
            warranty: payload.warranty || undefined,
            addons: payload.addons ? (typeof payload.addons === 'string' ? JSON.parse(payload.addons) : payload.addons) : undefined,
            // pricing should be handled at variant level via nested variants
            shopkeeperId: shopkeeper.id,
            categoryId: payload.categoryId || undefined,
            isFeatured: payload.isFeatured !== undefined ? !!payload.isFeatured : undefined,
            isBestSeller: payload.isBestSeller !== undefined ? !!payload.isBestSeller : undefined,
            howToUse: payload.howToUse || undefined,
            shortDescription: payload.shortDescription || undefined,
            isActive: payload.isActive !== undefined ? !!payload.isActive : true,
            benefits: payload.benefits ? (typeof payload.benefits === 'string' ? JSON.parse(payload.benefits) : payload.benefits) : undefined,
            skinType: payload.skinType ? (typeof payload.skinType === 'string' ? JSON.parse(payload.skinType) : payload.skinType) : undefined,
            isBundle: payload.isBundle !== undefined ? !!payload.isBundle : undefined,
            metaTitle: payload.metaTitle || undefined,
            metaDesc: payload.metaDesc || undefined,
            tags: payload.tags ? (typeof payload.tags === 'string' ? JSON.parse(payload.tags) : payload.tags) : undefined
        };

        // Remove undefined properties to avoid Prisma errors
        Object.keys(createData).forEach(k => createData[k] === undefined && delete createData[k]);

        // Attach variants as nested create if present (keeps previous variant shape)
        if (variantsData) {
            createData.variants = {
                create: variantsData.map((v, index) => ({
                    name: v.size || v.name || null,
                    images: uploadedVariantImages[index] || [],
                    sku: v.sku || genSku(),
                    mrp: v.mrp !== undefined ? parseFloat(v.mrp) : (v.price !== undefined ? parseFloat(v.price) : 0),
                    sellingPrice: v.sellingPrice !== undefined ? parseFloat(v.sellingPrice) : (v.price !== undefined ? parseFloat(v.price) : 0),
                    costPrice: v.costPrice !== undefined ? parseFloat(v.costPrice) : undefined,
                    weight: v.weight !== undefined ? parseFloat(v.weight) : undefined,
                    volume: v.volume !== undefined ? parseFloat(v.volume) : undefined,
                    stockQty: v.stockQty !== undefined ? parseInt(v.stockQty) : 0,
                    lowStockAlert: v.lowStockAlert !== undefined ? parseInt(v.lowStockAlert) : 10,
                    isDefault: !!v.isDefault,
                    isActive: v.isActive !== undefined ? !!v.isActive : true,
                    sortOrder: v.sortOrder !== undefined ? parseInt(v.sortOrder) : 0
                }))
            };
        }

        const item = await prisma.item.create({ data: createData });
        res.status(201).json({ success: true, item });
    } catch (err) {
        console.error('Create item error', err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

// Append images to an existing item later
inventoryRouter.post('/item/:id/images', shopkeeperMiddleware, upload.array('images', 5), async (req, res) => {
    const { id } = req.params;
    try {
        const shopkeeperid = await req.shopkeeperid;
        const item = await prisma.item.findUnique({ where: { id } });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        if (item.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized to update this item' });
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one image file is required' });
        }

        const uploadedImages = await uploadImageBuffers(req.files);
        const nextImages = Array.from(new Set([...(item.images || []), ...uploadedImages]));

        const updated = await prisma.item.update({
            where: { id },
            data: { images: nextImages }
        });

        res.status(200).json({ success: true, item: updated });
    } catch (err) {
        console.error('Append item images error', err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

// Shopkeeper images CRUD (ShopkeeperImage model)
inventoryRouter.post('/shop-image', shopkeeperMiddleware, upload.single('image'), async (req, res) => {
    const { description } = req.body;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const shopkeeper = await prisma.shopkeeper.findUnique({ where: { id: shopkeeperid } });
        if (!shopkeeper) return res.status(404).json({ success: false, message: "Shopkeeper not found" });
        if (!req.file) return res.status(400).json({ success: false, message: "Image file is required" });
        const imageurl = await uploadImageBuffer(req.file.buffer);
        const shopImage = await prisma.shopkeeperImage.create({
            data: {
                imageurl,
                description,
                shopkeeperId: shopkeeper.id
            }
        });
        res.status(201).json({ success: true, shopImage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

inventoryRouter.post('/offer', shopkeeperMiddleware, upload.fields([{ name: 'image' }, { name: 'banner' }]), async (req, res) => {
    try {
        const files = req.files || {};
        const {
            title,
            description,
            discountType,
            discountValue,
            minQty,
            buyQty,
            getQty,
            isActive,
            startDate,
            endDate,
            applicableProductIds,
            applicableCategoryIds
        } = req.body;

        if (!title || !discountType || discountValue === undefined) {
            return res.status(400).json({ success: false, message: 'title, discountType and discountValue are required' });
        }

        let imageUrl = null;
        let bannerUrl = null;
        if (files.image && files.image[0]) imageUrl = await uploadImageBuffer(files.image[0].buffer);
        if (files.banner && files.banner[0]) bannerUrl = await uploadImageBuffer(files.banner[0].buffer);

        const offer = await prisma.offer.create({
            data: {
                title,
                description: description || null,
                discountType,
                discountValue: Number(discountValue),
                minQty: minQty !== undefined && minQty !== '' ? Number.parseInt(minQty, 10) : null,
                buyQty: buyQty !== undefined && buyQty !== '' ? Number.parseInt(buyQty, 10) : null,
                getQty: getQty !== undefined && getQty !== '' ? Number.parseInt(getQty, 10) : null,
                isActive: isActive !== undefined ? String(isActive) === 'true' : true,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : null,
                imageUrl,
                bannerUrl,
                applicableProductIds: applicableProductIds ? (typeof applicableProductIds === 'string' ? JSON.parse(applicableProductIds) : applicableProductIds) : [],
                applicableCategoryIds: applicableCategoryIds ? (typeof applicableCategoryIds === 'string' ? JSON.parse(applicableCategoryIds) : applicableCategoryIds) : []
            }
        });

        res.status(201).json({ success: true, offer });
    } catch (err) {
        console.error('Create offer error', err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

// Get all shop images public for current shopkeeper
inventoryRouter.get('/shop-images', shopkeeperMiddleware, async (req, res) => {
    const shopkeeperid = await req.shopkeeperid;
    try {
        const shopkeeper = await prisma.shopkeeper.findUnique({ where: { id: shopkeeperid } });
        if (!shopkeeper) return res.status(404).json({ success: false, message: "Shopkeeper not found" });
        const images = await prisma.shopkeeperImage.findMany({
            where: { shopkeeperId: shopkeeper.id },
            select: { id: true, imageurl: true, description: true, uploadedAt: true }
        });
        res.status(200).json({ success: true, images });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

// Get single shop image by id
inventoryRouter.get('/shop-image/:id', shopkeeperMiddleware, async (req, res) => {
    const { id } = req.params;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const image = await prisma.shopkeeperImage.findUnique({ where: { id } });
        if (!image) return res.status(404).json({ success: false, message: 'Shop image not found' });
        if (image.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized to view this image' });
        res.status(200).json({ success: true, image });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

// Update shop image (description and/or replace image)
inventoryRouter.put('/shop-image/:id', shopkeeperMiddleware, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { description } = req.body;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const existing = await prisma.shopkeeperImage.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ success: false, message: 'Shop image not found' });
        if (existing.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized to update this image' });
        const updateData = {};
        if (description !== undefined) updateData.description = description;
        if (req.file) updateData.imageurl = await uploadImageBuffer(req.file.buffer);
        const updated = await prisma.shopkeeperImage.update({ where: { id }, data: updateData });
        res.status(200).json({ success: true, updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

// Delete a shop image
inventoryRouter.delete('/shop-image/:id', shopkeeperMiddleware, async (req, res) => {
    const { id } = req.params;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const existing = await prisma.shopkeeperImage.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ success: false, message: 'Shop image not found' });
        if (existing.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized to delete this image' });
        await prisma.shopkeeperImage.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Shop image deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

// Update item (fields and images)
inventoryRouter.put('/item/:id', shopkeeperMiddleware, upload.array('images', 5), async (req, res) => {
    const { minimumpurchase, title, unit, description, warranty, addons, categoryId, variants } = req.body;
    const { id } = req.params;
    try {
        let updateData = {};
        // parse and validate variants if provided
        let variantsData = undefined;
        if (variants) {
            try {
                variantsData = typeof variants === 'string' ? JSON.parse(variants) : variants;
                if (!Array.isArray(variantsData)) return res.status(400).json({ success: false, message: 'Variants must be an array.' });
            } catch (e) {
                return res.status(400).json({ success: false, message: 'Invalid variants JSON.' });
            }
        }

        if (title) updateData.title = title;
        if (req.files && req.files.length > 0) {
            if (req.files.length < 1 || req.files.length > 5) return res.status(400).json({ success: false, message: 'You must provide between 1 and 5 image files.' });
            updateData.images = await uploadImageBuffers(req.files);
        }
        if (unit) updateData.unit = unit;
        if (minimumpurchase) updateData.minimumpurchase = parseInt(minimumpurchase);
        if (description) updateData.description = description;
        if (warranty) updateData.warranty = warranty;
        if (addons) updateData.addons = typeof addons === 'string' ? JSON.parse(addons) : addons;
        if (categoryId) updateData.categoryId = categoryId;

        // Update item core fields first
        let item = await prisma.item.update({ where: { id }, data: updateData });

        // If variants provided, replace existing ProductVariant records for this item
        if (variantsData) {
            try {
                await prisma.productVariant.deleteMany({ where: { productId: id } });
                for (const v of variantsData) {
                    await prisma.productVariant.create({
                        data: {
                            productId: id,
                            name: v.size || v.name || 'Variant',
                            sku: v.sku || genSku(),
                            mrp: v.mrp !== undefined ? parseFloat(v.mrp) : (v.price !== undefined ? parseFloat(v.price) : 0),
                            sellingPrice: v.sellingPrice !== undefined ? parseFloat(v.sellingPrice) : (v.price !== undefined ? parseFloat(v.price) : 0),
                            costPrice: v.costPrice !== undefined ? parseFloat(v.costPrice) : undefined,
                            weight: v.weight !== undefined ? parseFloat(v.weight) : undefined,
                            volume: v.volume !== undefined ? parseFloat(v.volume) : undefined,
                            stockQty: v.stockQty !== undefined ? parseInt(v.stockQty) : 0,
                            lowStockAlert: v.lowStockAlert !== undefined ? parseInt(v.lowStockAlert) : 10,
                            isDefault: !!v.isDefault,
                            isActive: v.isActive !== undefined ? !!v.isActive : true,
                            sortOrder: v.sortOrder !== undefined ? parseInt(v.sortOrder) : 0
                        }
                    });
                }
            } catch (e) {
                console.error('Error updating product variants', e);
                return res.status(500).json({ success: false, message: 'Failed to update variants' });
            }
        }

        // Reload item with variants
        item = await prisma.item.findUnique({ where: { id }, include: { variants: true } });
        res.status(200).json({ success: true, item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

// Delete an item (only owner shopkeeper can delete)
inventoryRouter.delete('/item/:id', shopkeeperMiddleware, async (req, res) => {
    const { id } = req.params;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const item = await prisma.item.findUnique({ where: { id } });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        if (item.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized to delete this item' });
        await prisma.item.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Item deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

// Inventory summary with low/high stock filters
inventoryRouter.get('/inventory/variants', shopkeeperMiddleware, async (req, res) => {
    const shopkeeperid = await req.shopkeeperid;
    const filter = String(req.query.filter || req.query.stock || 'all').toLowerCase();
    try {
        const inventory = await getInventoryVariants(shopkeeperid, filter);

        res.json({ success: true, filter, inventory });
    } catch (err) {
        console.error('Inventory variants error', err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

inventoryRouter.get('/inventory/variants/low', shopkeeperMiddleware, async (req, res) => {
    const shopkeeperid = await req.shopkeeperid;
    try {
        const inventory = await getInventoryVariants(shopkeeperid, 'low');
        res.json({ success: true, filter: 'low', inventory });
    } catch (err) {
        console.error('Inventory low stock error', err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

inventoryRouter.get('/inventory/variants/high', shopkeeperMiddleware, async (req, res) => {
    const shopkeeperid = await req.shopkeeperid;
    try {
        const inventory = await getInventoryVariants(shopkeeperid, 'high');
        res.json({ success: true, filter: 'high', inventory });
    } catch (err) {
        console.error('Inventory high stock error', err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

inventoryRouter.get('/inventory/stock-movements', shopkeeperMiddleware, async (req, res) => {
    const shopkeeperid = await req.shopkeeperid;
    const { variantId } = req.query;
    try {
        const where = { shopkeeperId: shopkeeperid };
        if (variantId) where.variantId = String(variantId);

        const logs = await prisma.inventoryLog.findMany({
            where,
            include: {
                variant: { select: { id: true, name: true, sku: true, stockQty: true, lowStockAlert: true, product: { select: { id: true, title: true, slug: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, logs });
    } catch (err) {
        console.error('Inventory logs error', err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

inventoryRouter.get('/admin/products/:id/variants/:variantId/stock-movements', shopkeeperMiddleware, async (req, res) => {
    const { id, variantId } = req.params;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const product = await prisma.item.findUnique({ where: { id } });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized' });

        const logs = await prisma.inventoryLog.findMany({
            where: { variantId, shopkeeperId: shopkeeperid },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, logs });
    } catch (err) {
        console.error('Variant movement history error', err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

// Get all categories
inventoryRouter.get('/categories', shopkeeperMiddleware, async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
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
        });
        res.status(200).json({ success: true, categories });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

// Get all items
inventoryRouter.get('/items', shopkeeperMiddleware, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // 1. Extract all potential query parameters
        const {
            // Text Search
            search,
            // Relations
            categoryId, variantStatus,
            // Booleans
            isBestSeller, isFeatured, isActive, isBundle,
            // Arrays (Scalar Lists)
            tags, skinType, benefits,
            // Exact Strings
            availability, unit,
            // Numbers
            minRating, minPurchase
        } = req.query;

        // 2. Initialize the dynamic where clause
        const whereClause = {
            shopkeeperId: await req.shopkeeperid,
        };

        // --- TEXT SEARCH (Case-insensitive) ---
        // Searches for the keyword in either the title OR the short description
        if (search) {
            whereClause.OR = [
                { title: { contains: String(search), mode: 'insensitive' } },
                { shortDescription: { contains: String(search), mode: 'insensitive' } }
            ];
        }

        // --- RELATIONS ---
        if (categoryId) {
            whereClause.categoryId = String(categoryId);
        }
        if (variantStatus === 'active') {
            whereClause.variants = { some: { isActive: true } };
        }

        // --- BOOLEANS ---
        // Helper function to keep code DRY for boolean checks
        const applyBooleanFilter = (key, value) => {
            if (value === 'true') whereClause[key] = true;
            if (value === 'false') whereClause[key] = false;
        };
        applyBooleanFilter('isBestSeller', isBestSeller);
        applyBooleanFilter('isFeatured', isFeatured);
        applyBooleanFilter('isActive', isActive);
        applyBooleanFilter('isBundle', isBundle);

        // --- EXACT STRINGS ---
        if (availability) whereClause.availability = String(availability);
        if (unit) whereClause.unit = String(unit);

        // --- ARRAYS (PostgreSQL Scalar Lists) ---
        // Expects comma-separated values in URL: ?tags=organic,vegan
        const applyArrayFilter = (key, value) => {
            if (value) {
                const valuesArray = String(value).split(',').map(v => v.trim());
                // hasSome returns items that match ANY of the provided array values
                whereClause[key] = { hasSome: valuesArray };
            }
        };
        applyArrayFilter('tags', tags);
        applyArrayFilter('skinType', skinType);
        applyArrayFilter('benefits', benefits);

        // --- NUMBERS ---
        if (minRating) {
            whereClause.averageRating = { gte: parseFloat(minRating) }; // gte = Greater Than or Equal
        }
        if (minPurchase) {
            whereClause.minimumpurchase = { gte: parseInt(minPurchase, 10) };
        }

        // 3. Get total count for frontend pagination
        const totalItems = await prisma.item.count({
            where: whereClause
        });

        // 4. Execute the query
        const items = await prisma.item.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                slug: true,
                images: true,
                unit: true,
                shortDescription: true,
                description: true,
                minimumpurchase: true,
                warranty: true,
                isFeatured: true,
                addons: true,
                tags: true,
                isActive: true,
                isBundle: true,
                createdAt: true,
                isBestSeller: true,
                averageRating: true,
                availability: true,
                _count: {
                    select: { variants: true }
                },
                category: {
                    select: { title: true, id: true }
                }
            },
            skip,
            take: limit,
            // Optional: Add sorting (e.g., newest first)
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            pagination: {
                total: totalItems,
                page,
                limit,
                totalPages: Math.ceil(totalItems / limit)
            },
            items
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});
// Get items under a specific category
inventoryRouter.get('/category/:categoryId/items', shopkeeperMiddleware, async (req, res) => {
    const { categoryId } = req.params;
    try {
        const items = await prisma.item.findMany({
            where: { categoryId },
            select: {
                id: true,
                title: true,
                slug: true,
                images: true,
                unit: true,
                shortDescription: true,
                description: true,
                minimumpurchase: true,
                warranty: true,
                addons: true,
                tags: true,
                isActive: true,
                createdAt: true
            }
        });
        res.status(200).json({ success: true, items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

// Get single product (shopkeeper) with variants
inventoryRouter.get('/item/:id', shopkeeperMiddleware, async (req, res) => {
    const { id } = req.params;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const item = await prisma.item.findUnique({
            where: { id },
            include: { variants: true }
        });
        if (!item) return res.status(404).json({ success: false, message: 'Product not found' });
        if (item.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized' });
        res.json({ success: true, item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

// Admin: list variants for a product
inventoryRouter.get('/products/:id/variants', shopkeeperMiddleware, async (req, res) => {
    const { id } = req.params;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const product = await prisma.item.findUnique({ where: { id } });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized' });
        const variants = await prisma.productVariant.findMany({ where: { productId: id } });
        res.json({ success: true, variants });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

// NOTE: Product creation is handled by POST /item (supports file uploads or images array).

// Update product
inventoryRouter.put(
    "/admin/products/:id",
    shopkeeperMiddleware,
    upload.any(),
    async (req, res) => {
        const { id } = req.params;
        const shopkeeperid = await req.shopkeeperid;
        const data = req.body;

        // Helper to safely convert comma-separated strings into Prisma arrays
        // Helper to safely convert strings or stringified JSON into Prisma arrays
        const stringToArray = (val) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;

            if (typeof val === 'string') {
                try {
                    // 1. Try your method: parsing it as a JSON array
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) return parsed;

                    // If it parsed successfully but isn't an array, wrap it in an array
                    return [parsed];
                } catch (error) {
                    // 2. Fallback: If JSON.parse fails (meaning it's just a regular string like "A, B"), split by comma
                    return val.split(',').map(item => item.trim()).filter(Boolean);
                }
            }

            return [];
        };

        try {
            const files = req.files || [];

            const mainImageFiles = files.filter(
                file => file.fieldname === "images"
            );

            let imageUrls;

            if (mainImageFiles.length > 0) {
                if (mainImageFiles.length > 5) {
                    return res.status(400).json({
                        success: false,
                        message: "Maximum 5 images allowed"
                    });
                }
                imageUrls = await uploadImageBuffers(mainImageFiles);
            }

            const existing = await prisma.item.findUnique({ where: { id } });
            if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });
            if (existing.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized' });

            const updateData = {};

            // 1. Handle standard string fields
            const stringFields = ['title', 'unit', 'howToUse', 'slug', 'shortDescription', 'description', 'metaTitle', 'metaDesc', 'warranty', 'availability', 'categoryId'];
            for (const k of stringFields) {
                if (data[k] !== undefined) updateData[k] = data[k];
            }

            // 2. Handle array fields (THE FIX)
            const arrayFields = ['benefits', 'skinType', 'tags', 'addons']; // Added addons assuming it's also an array
            for (const k of arrayFields) {
                if (data[k] !== undefined) {
                    updateData[k] = stringToArray(data[k]);
                }
            }

            // 3. Handle Boolean and Number fields from FormData (Prevents future Prisma errors)
            if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured === 'true';
            if (data.isBestSeller !== undefined) updateData.isBestSeller = data.isBestSeller === 'true';
            if (data.isActive !== undefined) updateData.isActive = data.isActive === 'true';
            if (data.isBundle !== undefined) updateData.isBundle = data.isBundle === 'true';
            if (data.minimumpurchase !== undefined) updateData.minimumpurchase = parseInt(data.minimumpurchase, 10);

            // 4. Handle Images
            if (imageUrls) {
                updateData.images = imageUrls;
            }

            // 5. Handle Slug creation
            if (data.title && updateData.slug === undefined) {
                updateData.slug = await makeUniqueItemSlug(data.title);
            }

            const updated = await prisma.item.update({ where: { id }, data: updateData });
            res.json({ success: true, product: updated });

        } catch (err) {
            console.error('Admin update product error', err);
            res.status(500).json({ success: false, message: 'Failed to update product' });
        }
    });

// Delete product
inventoryRouter.delete('/products/:id', shopkeeperMiddleware, async (req, res) => {
    const { id } = req.params;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const existing = await prisma.item.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });
        if (existing.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized' });
        await prisma.item.delete({ where: { id } });
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        console.error('Admin delete product error', err);
        res.status(500).json({ success: false, message: 'Failed to delete product' });
    }
});

// Toggle product active
inventoryRouter.patch('/admin/products/:id/toggle', shopkeeperMiddleware, async (req, res) => {
    const { id } = req.params;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const existing = await prisma.item.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });
        if (existing.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized' });
        const updated = await prisma.item.update({ where: { id }, data: { isActive: !existing.isActive } });
        res.json({ success: true, product: updated });
    } catch (err) {
        console.error('Admin toggle product error', err);
        res.status(500).json({ success: false, message: 'Failed to toggle product' });
    }
});

// Variants management for product
inventoryRouter.post('/admin/products/:id/variants', shopkeeperMiddleware, async (req, res) => {
    const { id } = req.params; // product id
    const shopkeeperid = await req.shopkeeperid;
    const v = req.body;
    try {
        const product = await prisma.item.findUnique({ where: { id } });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized' });

        // If this variant is marked default, clear other defaults for this product
        if (v.isDefault) {
            await prisma.productVariant.updateMany({ where: { productId: id, isDefault: true }, data: { isDefault: false } });
        }
        const created = await prisma.productVariant.create({
            data: {
                productId: id,
                name: v.name || 'Variant',
                sku: v.sku || genSku(),
                mrp: v.mrp !== undefined ? parseFloat(v.mrp) : (v.price !== undefined ? parseFloat(v.price) : 0),
                sellingPrice: v.sellingPrice !== undefined ? parseFloat(v.sellingPrice) : (v.price !== undefined ? parseFloat(v.price) : 0),
                costPrice: v.costPrice !== undefined ? parseFloat(v.costPrice) : undefined,
                weight: v.weight !== undefined ? parseFloat(v.weight) : undefined,
                volume: v.volume !== undefined ? parseFloat(v.volume) : undefined,
                stockQty: v.stockQty !== undefined ? parseInt(v.stockQty) : 0,
                lowStockAlert: v.lowStockAlert !== undefined ? parseInt(v.lowStockAlert) : 10,
                isDefault: !!v.isDefault,
                isActive: v.isActive !== undefined ? !!v.isActive : true,
                sortOrder: v.sortOrder !== undefined ? parseInt(v.sortOrder) : 0
            }
        });
        res.status(201).json({ success: true, variant: created });
    } catch (err) {
        console.error('Create variant error', err);
        res.status(500).json({ success: false, message: 'Failed to create variant' });
    }
});

inventoryRouter.put(
    "/admin/products/:id/variants/:variantId",
    shopkeeperMiddleware,
    upload.any(),
    async (req, res) => {
        const { id, variantId } = req.params;
        const shopkeeperid = await req.shopkeeperid;
        const v = req.body;
        try {

            const files = req.files || [];

            const variantImageFiles = files.filter(
                file => file.fieldname === "images"
            );

            let uploadedImages;

            if (variantImageFiles.length > 0) {

                uploadedImages = await uploadImageBuffers(
                    variantImageFiles
                );
            }

            const product = await prisma.item.findUnique({ where: { id } });
            if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
            if (product.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized' });

            const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
            if (!existing) return res.status(404).json({ success: false, message: 'Variant not found' });
            if (existing.productId !== id) return res.status(400).json({ success: false, message: 'Variant does not belong to product' });

            const updateData = {};

            if (uploadedImages) {
                updateData.images = uploadedImages;
            }
            if (v.name !== undefined) updateData.name = v.name;
            if (v.sku !== undefined) updateData.sku = v.sku;
            if (v.mrp !== undefined) updateData.mrp = parseFloat(v.mrp);
            if (v.sellingPrice !== undefined) updateData.sellingPrice = parseFloat(v.sellingPrice);
            if (v.costPrice !== undefined) updateData.costPrice = parseFloat(v.costPrice);
            if (v.weight !== undefined) updateData.weight = parseFloat(v.weight);
            if (v.volume !== undefined) updateData.volume = parseFloat(v.volume);
            if (v.stockQty !== undefined) updateData.stockQty = parseInt(v.stockQty);
            if (v.lowStockAlert !== undefined) updateData.lowStockAlert = parseInt(v.lowStockAlert);
            if (v.isDefault !== undefined) updateData.isDefault = !!v.isDefault;
            if (v.isActive !== undefined) updateData.isActive = !!v.isActive;
            if (v.sortOrder !== undefined) updateData.sortOrder = parseInt(v.sortOrder);

            // If setting this variant as default, unset other defaults
            if (v.isDefault) {
                await prisma.productVariant.updateMany({ where: { productId: id, isDefault: true }, data: { isDefault: false } });
            }

            const updated = await prisma.productVariant.update({ where: { id: variantId }, data: updateData });
            res.json({ success: true, variant: updated });
        } catch (err) {
            console.error('Update variant error', err);
            res.status(500).json({ success: false, message: 'Failed to update variant' });
        }
    });

inventoryRouter.delete('/admin/products/:id/variants/:variantId', shopkeeperMiddleware, async (req, res) => {
    const { id, variantId } = req.params;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const product = await prisma.item.findUnique({ where: { id } });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized' });

        const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
        if (!existing) return res.status(404).json({ success: false, message: 'Variant not found' });
        if (existing.productId !== id) return res.status(400).json({ success: false, message: 'Variant does not belong to product' });

        await prisma.productVariant.delete({ where: { id: variantId } });
        res.json({ success: true, message: 'Variant deleted' });
    } catch (err) {
        console.error('Delete variant error', err);
        res.status(500).json({ success: false, message: 'Failed to delete variant' });
    }
});

inventoryRouter.patch('/admin/products/:id/variants/:variantId/toggle', shopkeeperMiddleware, async (req, res) => {
    const { id, variantId } = req.params;
    const shopkeeperid = await req.shopkeeperid;
    try {
        const product = await prisma.item.findUnique({ where: { id } });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized' });

        const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
        if (!existing) return res.status(404).json({ success: false, message: 'Variant not found' });
        if (existing.productId !== id) return res.status(400).json({ success: false, message: 'Variant does not belong to product' });

        const updated = await prisma.productVariant.update({ where: { id: variantId }, data: { isActive: !existing.isActive } });
        res.json({ success: true, variant: updated });
    } catch (err) {
        console.error('Toggle variant error', err);
        res.status(500).json({ success: false, message: 'Failed to toggle variant' });
    }
});

inventoryRouter.patch('/admin/products/:id/variants/:variantId/stock', shopkeeperMiddleware, async (req, res) => {
    const { id, variantId } = req.params;
    const shopkeeperid = await req.shopkeeperid;
    const { quantity, action, note, referenceType, referenceId } = req.body;
    try {
        const product = await prisma.item.findUnique({ where: { id } });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.shopkeeperId !== shopkeeperid) return res.status(403).json({ success: false, message: 'Not authorized' });

        const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
        if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });
        if (variant.productId !== id) return res.status(400).json({ success: false, message: 'Variant does not belong to product' });

        const parsedQuantity = Number.parseInt(quantity, 10);
        if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
            return res.status(400).json({ success: false, message: 'quantity must be a non-negative integer' });
        }

        const movementType = normalizeStockMovement(action);
        const previousQty = variant.stockQty;
        let newQty = previousQty;

        if (movementType === 'INCREMENT') {
            newQty = previousQty + parsedQuantity;
        } else if (movementType === 'DECREMENT') {
            if (parsedQuantity > previousQty) {
                return res.status(400).json({ success: false, message: 'Insufficient stock' });
            }
            newQty = previousQty - parsedQuantity;
        } else {
            newQty = parsedQuantity;
        }

        const updated = await prisma.$transaction(async (tx) => {
            const nextVariant = await tx.productVariant.update({
                where: { id: variantId },
                data: { stockQty: newQty }
            });

            await tx.inventoryLog.create({
                data: {
                    variantId,
                    shopkeeperId: shopkeeperid,
                    type: movementType,
                    quantityChange: newQty - previousQty,
                    previousQty,
                    newQty,
                    note: note || null,
                    referenceType: referenceType || null,
                    referenceId: referenceId || null
                }
            });

            return nextVariant;
        });

        res.json({ success: true, variant: { ...updated, stockStatus: getStockStatus(updated) } });
    } catch (err) {
        console.error('Update stock error', err);
        res.status(500).json({ success: false, message: 'Failed to update stock' });
    }
});
