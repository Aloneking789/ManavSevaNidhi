import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prismaConfig.js";
import { shopkeeperMiddleware } from "../../middlewares/shopkeeperAuth.js";

export const authRouter = Router();

// Note: per request, passwords are stored and compared as plain text (no hashing)

function signShopkeeperToken(shopkeeperId, userId) {
    return jwt.sign(
        { shopkeeperid: shopkeeperId, userid: userId, role: 'shopkeeper' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
    // dummy change
}

function buildProfileSelection(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        profileimage: user.profileimage,
    };
}

authRouter.post('/signup', async (req, res) => {
    const {
        email,
        password,
        name,
        phone,
        profileimage,
        shopname,
        city,
        state,
        pincode,
        flatnumber,
    } = req.body;

    if (!email || !password || !shopname) {
        return res.status(400).json({ success: false, message: 'email, password and shopname are required' });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { shopkeeper: true },
        });

        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        const created = await prisma.user.create({
            data: {
                email,
                password: password,
                name: name || email.split('@')[0],
                phone: phone || null,
                profileimage: profileimage || '',
                shopkeeper: {
                    create: {
                        shopname,
                        ...(city && state && pincode && flatnumber !== undefined
                            ? {
                                shopaddress: {
                                    create: {
                                        city,
                                        state,
                                        pincode,
                                        flatnumber: Number(flatnumber),
                                    },
                                },
                            }
                            : {}),
                    },
                },
            },
            include: {
                shopkeeper: {
                    include: {
                        shopaddress: true,
                    },
                },
            },
        });

        const token = signShopkeeperToken(created.shopkeeper.id, created.id);

        return res.status(201).json({
            success: true,
            token,
            user: buildProfileSelection(created),
            shopkeeper: created.shopkeeper,
        });
    } catch (err) {
        console.error('Shopkeeper signup error:', err);
        return res.status(500).json({ success: false, message: 'Signup failed' });
    }
});

authRouter.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                shopkeeper: {
                    include: {
                        shopaddress: true,
                    },
                },
            },
        });

        if (!user || !user.password || user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        if (!user.shopkeeper) {
            return res.status(403).json({ success: false, message: 'Shopkeeper profile not found' });
        }

        const token = signShopkeeperToken(user.shopkeeper.id, user.id);

        return res.status(200).json({
            success: true,
            token,
            user: buildProfileSelection(user),
            shopkeeper: user.shopkeeper,
        });
    } catch (err) {
        console.error('Shopkeeper signin error:', err);
        return res.status(500).json({ success: false, message: 'Signin failed' });
    }
});

authRouter.get('/profile', shopkeeperMiddleware, async (req, res) => {
    try {
        const shopkeeper = await prisma.shopkeeper.findUnique({
            where: { id: req.shopkeeperid },
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true, profileimage: true },
                },
                shopaddress: true,
            },
        });

        if (!shopkeeper) {
            return res.status(404).json({ success: false, message: 'Shopkeeper not found' });
        }

        return res.status(200).json({ success: true, profile: shopkeeper });
    } catch (err) {
        console.error('Profile error:', err);
        return res.status(500).json({ success: false, message: 'Profile fetch failed' });
    }
});

authRouter.put('/profile', shopkeeperMiddleware, async (req, res) => {
    try {
        const { name, phone, profileimage, shopname } = req.body;
        const userUpdate = {};
        const shopkeeperUpdate = {};

        if (name !== undefined) userUpdate.name = name;
        if (phone !== undefined) userUpdate.phone = phone;
        if (profileimage !== undefined) userUpdate.profileimage = profileimage;
        if (shopname !== undefined) shopkeeperUpdate.shopname = shopname;

        const shopkeeper = await prisma.shopkeeper.findUnique({
            where: { id: req.shopkeeperid },
            select: { userid: true },
        });

        if (!shopkeeper) {
            return res.status(404).json({ success: false, message: 'Shopkeeper not found' });
        }

        if (Object.keys(userUpdate).length) {
            await prisma.user.update({
                where: { id: shopkeeper.userid },
                data: userUpdate,
            });
        }

        if (Object.keys(shopkeeperUpdate).length) {
            await prisma.shopkeeper.update({
                where: { id: req.shopkeeperid },
                data: shopkeeperUpdate,
            });
        }

        return res.status(200).json({ success: true, message: 'Profile updated' });
    } catch (err) {
        console.error('Profile update error:', err);
        return res.status(500).json({ success: false, message: 'Update failed' });
    }
});
