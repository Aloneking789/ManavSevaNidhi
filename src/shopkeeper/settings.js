import { Router } from "express";
import { prisma } from "../../config/prismaConfig.js";
import { shopkeeperMiddleware } from "../../middlewares/shopkeeperAuth.js";

export const settingsRouter = Router();

export async function getPlatformSettings() {
    let settings = await prisma.platformSetting.findUnique({
        where: { id: 'default' }
    });

    if (!settings) {
        const defaultShipping = Number(process.env.DEFAULT_SHIPPING_CHARGE || 50);
        const defaultPlatform = Number(process.env.DEFAULT_PLATFORM_FEE || 10);
        settings = await prisma.platformSetting.upsert({
            where: { id: 'default' },
            update: {},
            create: {
                id: 'default',
                shippingCharge: defaultShipping,
                platformFee: defaultPlatform
            }
        });
    }

    return {
        shippingCharge: Number(settings.shippingCharge),
        platformFee: Number(settings.platformFee)
    };
}

/**
 * GET /api/v1/owner/settings
 * Fetch platform-wide shipping charge and platform fee
 */
settingsRouter.get('/', shopkeeperMiddleware, async (req, res) => {
    try {
        const settings = await getPlatformSettings();
        return res.json({ success: true, settings });
    } catch (err) {
        console.error('Fetch settings error:', err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});

/**
 * PUT /api/v1/owner/settings
 * Modify platform-wide shipping charge and platform fee
 */
settingsRouter.put('/', shopkeeperMiddleware, async (req, res) => {
    const { shippingCharge, platformFee } = req.body;

    const data = {};
    if (shippingCharge !== undefined && shippingCharge !== null && shippingCharge !== '') {
        const parsed = Number(shippingCharge);
        if (Number.isNaN(parsed) || parsed < 0) {
            return res.status(400).json({ success: false, message: 'shippingCharge must be a non-negative number' });
        }
        data.shippingCharge = parsed;
    }

    if (platformFee !== undefined && platformFee !== null && platformFee !== '') {
        const parsed = Number(platformFee);
        if (Number.isNaN(parsed) || parsed < 0) {
            return res.status(400).json({ success: false, message: 'platformFee must be a non-negative number' });
        }
        data.platformFee = parsed;
    }

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ success: false, message: 'At least one setting (shippingCharge or platformFee) is required' });
    }

    try {
        const defaultShipping = Number(process.env.DEFAULT_SHIPPING_CHARGE || 50);
        const defaultPlatform = Number(process.env.DEFAULT_PLATFORM_FEE || 10);

        const updated = await prisma.platformSetting.upsert({
            where: { id: 'default' },
            update: data,
            create: {
                id: 'default',
                shippingCharge: data.shippingCharge !== undefined ? data.shippingCharge : defaultShipping,
                platformFee: data.platformFee !== undefined ? data.platformFee : defaultPlatform
            }
        });

        const settings = {
            shippingCharge: Number(updated.shippingCharge),
            platformFee: Number(updated.platformFee)
        };

        return res.json({
            success: true,
            message: 'Platform settings updated successfully',
            settings
        });
    } catch (err) {
        console.error('Update settings error:', err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
});
