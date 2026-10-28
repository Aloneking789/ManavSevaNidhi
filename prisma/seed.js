import dotenv from 'dotenv';
import { prisma } from '../config/prismaConfig.js';

dotenv.config();

async function main() {
    console.log('Seeding database...');

    // 1. Seed Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shilomist.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Shilomist Admin';
    const adminPhone = process.env.ADMIN_PHONE || '9876543210';
    const shopName = process.env.ADMIN_SHOP_NAME || 'Shilomist Store';

    const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail },
        include: { shopkeeper: true },
    });

    if (existingUser) {
        console.log(`Admin user with email ${adminEmail} already exists.`);
        if (!existingUser.shopkeeper) {
            console.log('Creating shopkeeper profile for existing user...');
            const shopkeeper = await prisma.shopkeeper.create({
                data: {
                    userid: existingUser.id,
                    shopname: shopName,
                },
            });
            console.log('Shopkeeper profile created successfully:', shopkeeper.id);
        } else {
            console.log('Admin user shopkeeper profile already present:', existingUser.shopkeeper.id);
        }
    } else {
        const adminUser = await prisma.user.create({
            data: {
                email: adminEmail,
                password: adminPassword,
                name: adminName,
                phone: adminPhone,
                profileimage: '',
                shopkeeper: {
                    create: {
                        shopname: shopName,
                        shopaddress: {
                            create: {
                                city: 'Default City',
                                state: 'Default State',
                                pincode: '110001',
                                flatnumber: 1,
                            },
                        },
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

        console.log('Admin user seeded successfully!');
        console.log('Email:', adminUser.email);
        console.log('Password:', adminUser.password);
        console.log('User ID:', adminUser.id);
        console.log('Shopkeeper ID:', adminUser.shopkeeper?.id);
    }

    // 2. Seed Free Shipping Coupon
    const couponCode = process.env.FREESHIP_COUPON_CODE || 'FREESHIP500';
    const minAmount = Number(process.env.FREESHIP_MIN_AMOUNT || 500);

    const coupon = await prisma.coupon.upsert({
        where: { code: couponCode },
        update: {
            discountType: 'FREE_SHIPPING',
            discountValue: 0,
            minOrderAmount: minAmount,
            status: 'ACTIVE',
            description: `Free shipping on orders above ₹${minAmount}`,
        },
        create: {
            code: couponCode,
            discountType: 'FREE_SHIPPING',
            discountValue: 0,
            minOrderAmount: minAmount,
            status: 'ACTIVE',
            description: `Free shipping on orders above ₹${minAmount}`,
        },
    });

    console.log('Free shipping coupon seeded successfully!');
    console.log('Coupon Code:', coupon.code);
    console.log('Discount Type:', coupon.discountType);
    console.log('Minimum Order Amount:', coupon.minOrderAmount.toString());
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
