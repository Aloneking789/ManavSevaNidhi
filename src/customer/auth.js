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
    const avatar = user.avatar || user.profileimage || '';
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        avatar,
        profileimage: avatar,
    };
}

function parseValidDate(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

authRouter.post('/signup', async (req, res) => {
    const {
        email,
        password,
        name,
        gender,
        dateOfBirth,
        phone,
        avatar,
        profileimage,
        city,
        state,
        pincode,
        flatnumber,
        latitude,
        longitude,
    } = req.body;

    const resolvedAvatar = avatar || profileimage;
    const parsedDateOfBirth = parseValidDate(dateOfBirth);

    if (!email || !password || !name || !gender || !parsedDateOfBirth || !resolvedAvatar) {
        return res.status(400).json({ success: false, message: 'email, password, name, gender, dateOfBirth, and avatar are required' });
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
                gender,
                dateOfBirth: parsedDateOfBirth,
                phone: phone || null,
                avatar: resolvedAvatar,
                profileimage: resolvedAvatar,
                customer: {
                    create: {
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


authRouter.get(
    '/profile',

    customerMiddleware,

    async (req, res) => {

        try {

            const customer =
                await prisma.customer.findUnique({

                    where: {
                        id: req.customerid
                    },

                    include: {

                        user: {

                            select: {

                                id: true,

                                email: true,

                                name: true,

                                phone: true,

                                gender: true,

                                dateOfBirth: true,

                                avatar: true,

                                profileimage: true
                            }
                        },

                        houseaddress: true,

                        _count: {

                            select: {

                                orders: true,

                                wishlistItems: true,

                                houseaddress: true
                            }
                        }
                    }
                });

            if (!customer) {

                return res.status(404).json({

                    success: false,

                    message:
                        'Customer not found'
                });
            }

            // =========================
            // FORMAT COUNTS
            // =========================

            const profile = {

                ...customer,

                ordersCount:
                    customer._count.orders,

                wishlistCount:
                    customer._count.wishlistItems,

                addressCount:
                    customer._count.houseaddress
            };

            // remove raw prisma _count
            delete profile._count;

            return res.status(200).json({

                success: true,

                profile
            });

        } catch (err) {

            console.error(
                'Customer profile error:',
                err
            );

            return res.status(500).json({

                success: false,

                message:
                    'Profile fetch failed'
            });
        }
    }
);

authRouter.put('/profile', customerMiddleware, async (req, res) => {
    try {
        const { name, phone, gender, dateOfBirth, avatar, profileimage } = req.body;
        const userUpdate = {};

        if (name !== undefined) userUpdate.name = name;
        if (phone !== undefined) userUpdate.phone = phone;
        if (gender !== undefined) userUpdate.gender = gender;
        if (dateOfBirth !== undefined) {
            const parsedDateOfBirthUpdate = parseValidDate(dateOfBirth);
            if (dateOfBirth && !parsedDateOfBirthUpdate) {
                return res.status(400).json({ success: false, message: 'Invalid dateOfBirth' });
            }
            userUpdate.dateOfBirth = parsedDateOfBirthUpdate;
        }
        if (avatar !== undefined || profileimage !== undefined) {
            const nextAvatar = avatar || profileimage;
            userUpdate.avatar = nextAvatar;
            userUpdate.profileimage = nextAvatar;
        }

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

        return res.status(200).json({ success: true, message: 'Profile updated' });
    } catch (err) {
        console.error('Customer profile update error:', err);
        return res.status(500).json({ success: false, message: 'Update failed' });
    }
});
