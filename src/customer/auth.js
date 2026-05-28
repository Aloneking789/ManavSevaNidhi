import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from '../../config/prismaConfig.js';
import { customerMiddleware } from "../../middlewares/customerAuth.js";

export const authRouter = Router();

// Note: per request, passwords are stored and compared as plain text (no hashing)

function signCustomerToken(customerId, userId) {
    return jwt.sign(
        { customerid: customerId, userid: userId, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
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
        type,
        shopname,
        Shopname,
        Shopnumber,
        GSTnumber,
        Adhaarnumber,
        city,
        state,
        pincode,
        flatnumber,
        latitude,
        longitude,
    } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { customer: true },
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
                customer: {
                    create: {
                        type: type || 'RETAILER',
                        Shopname: shopname || Shopname || null,
                        Shopnumber: Shopnumber || null,
                        GSTnumber: GSTnumber || null,
                        Adhaarnumber: Adhaarnumber || null,
                        ...(city && state && pincode && flatnumber !== undefined
                            ? {
                                houseaddress: {
                                    create: {
                                        city,
                                        state,
                                        pincode,
                                        flatnumber: Number(flatnumber),
                                        ...(latitude !== undefined && latitude !== null ? { latitude: Number(latitude) } : {}),
                                        ...(longitude !== undefined && longitude !== null ? { longitude: Number(longitude) } : {}),
                                    },
                                },
                            }
                            : {}),
                    },
                },
            },
            include: {
                customer: {
                    include: {
                        houseaddress: true,
                    },
                },
            },
        });

        const token = signCustomerToken(created.customer.id, created.id);

        return res.status(201).json({
            success: true,
            token,
            user: buildProfileSelection(created),
            customer: created.customer,
        });
    } catch (err) {
        console.error('Customer signup error:', err);
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
                customer: {
                    include: {
                        houseaddress: true,
                    },
                },
            },
        });

        if (!user || !user.password || user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        if (!user.customer) {
            return res.status(403).json({ success: false, message: 'Customer profile not found' });
        }

        const token = signCustomerToken(user.customer.id, user.id);

        return res.status(200).json({
            success: true,
            token,
            user: buildProfileSelection(user),
            customer: user.customer,
        });
    } catch (err) {
        console.error('Customer signin error:', err);
        return res.status(500).json({ success: false, message: 'Signin failed' });
    }
});

authRouter.get('/profile', customerMiddleware, async (req, res) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: req.customerid },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                        profileimage: true,
                    },
                },
                houseaddress: true,
            },
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        return res.status(200).json({ success: true, profile: customer });
    } catch (err) {
        console.error('Customer profile error:', err);
        return res.status(500).json({ success: false, message: 'Profile fetch failed' });
    }
});

authRouter.put('/profile', customerMiddleware, async (req, res) => {
    try {
        const { name, phone, profileimage, shopname, Shopname, Shopnumber, GSTnumber, Adhaarnumber, type } = req.body;
        const userUpdate = {};
        const customerUpdate = {};

        if (name !== undefined) userUpdate.name = name;
        if (phone !== undefined) userUpdate.phone = phone;
        if (profileimage !== undefined) userUpdate.profileimage = profileimage;
        if (shopname !== undefined) customerUpdate.Shopname = shopname;
        if (Shopname !== undefined) customerUpdate.Shopname = Shopname;
        if (Shopnumber !== undefined) customerUpdate.Shopnumber = Shopnumber;
        if (GSTnumber !== undefined) customerUpdate.GSTnumber = GSTnumber;
        if (Adhaarnumber !== undefined) customerUpdate.Adhaarnumber = Adhaarnumber;
        if (type !== undefined) customerUpdate.type = type;

        const customer = await prisma.customer.findUnique({
            where: { id: req.customerid },
            select: { userid: true },
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        if (Object.keys(userUpdate).length) {
            await prisma.user.update({
                where: { id: customer.userid },
                data: userUpdate,
            });
        }

        if (Object.keys(customerUpdate).length) {
            await prisma.customer.update({
                where: { id: req.customerid },
                data: customerUpdate,
            });
        }

        return res.status(200).json({ success: true, message: 'Profile updated' });
    } catch (err) {
        console.error('Customer profile update error:', err);
        return res.status(500).json({ success: false, message: 'Update failed' });
    }
});
