import dotenv from 'dotenv';
import { prisma } from '../config/prismaConfig.js';

dotenv.config();

// ==========================================
// Kirana Store Catalog Data
// ==========================================
const kiranaCatalog = [
    {
        title: 'Atta, Flours & Grains',
        slug: 'atta-flours-grains',
        description: 'Fresh chakki atta, premium multigrain flours, sooji, besan, and whole grains for healthy daily meals.',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
        sortOrder: 1,
        items: [
            {
                title: 'Aashirvaad Superior MP Shudh Chakki Atta',
                slug: 'aashirvaad-shudh-chakki-atta',
                unit: 'KG',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: '100% pure whole wheat stone chakki fresh atta for extra soft rotis.',
                description: 'Aashirvaad Superior MP Atta is made from the grains which are heavy on the palm, golden amber in colour and hard in bite. It is carefully ground using modern chakki process to preserve natural dietary fibre and nutrients, keeping rotis softer for hours.',
                benefits: [
                    '100% Whole Wheat Grain with zero maida addition',
                    'Traditional Stone Chakki grinding process',
                    'Rich in natural dietary fibre and essential iron',
                    'Rotis stay soft and fluffy for long hours'
                ],
                tags: ['atta', 'wheat flour', 'aashirvaad', 'roti', 'kirana', 'staples'],
                howToUse: 'Knead with lukewarm water into a soft dough. Let it rest for 15 minutes before rolling into rotis or parathas.',
                faqs: [
                    { question: 'What is the shelf life of this atta?', answer: 'Best before 3 months from the date of packaging when stored in an airtight container.' },
                    { question: 'Does it contain any added maida or bleaching agent?', answer: 'No, it is 100% pure whole wheat without any added maida, starch, or bleaching agents.' }
                ],
                variants: [
                    {
                        name: '5 kg Bag',
                        sku: 'AASHIR-ATTA-5KG',
                        mrp: 275.00,
                        sellingPrice: 249.00,
                        costPrice: 220.00,
                        weight: '5 kg',
                        stockQty: 80,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { packaging: 'Pouch Bag', weight: '5 kg' }
                    },
                    {
                        name: '10 kg Bag',
                        sku: 'AASHIR-ATTA-10KG',
                        mrp: 525.00,
                        sellingPrice: 479.00,
                        costPrice: 425.00,
                        weight: '10 kg',
                        stockQty: 50,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { packaging: 'Polybags', weight: '10 kg' }
                    },
                    {
                        name: '1 kg Pouch',
                        sku: 'AASHIR-ATTA-1KG',
                        mrp: 62.00,
                        sellingPrice: 55.00,
                        costPrice: 48.00,
                        weight: '1 kg',
                        stockQty: 40,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { packaging: 'Pouch', weight: '1 kg' }
                    }
                ]
            },
            {
                title: 'Fortune Pure Chana Dal Besan (Gram Flour)',
                slug: 'fortune-pure-besan-gram-flour',
                unit: 'GRAM',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Finely ground 100% chana dal besan for crispy pakodas, dhokla, and sweets.',
                description: 'Fortune Besan is prepared from 100% top-quality unadulterated Chana Dal. Milled hygienically through advanced cool-grinding technology that keeps natural aroma, yellow color, and taste untouched.',
                benefits: [
                    'Made from 100% pure Chana Dal',
                    'Super-fine lump-free texture',
                    'Ideal for crispy bhajiyas, soft dhokla, and authentic besan laddoos'
                ],
                tags: ['besan', 'gram flour', 'fortune', 'pakoda', 'dhokla', 'snacks'],
                howToUse: 'Whisk with water, spices, and a pinch of baking soda for batter or roast slowly in desi ghee for laddoos.',
                variants: [
                    {
                        name: '500 g Pouch',
                        sku: 'FORT-BESAN-500G',
                        mrp: 70.00,
                        sellingPrice: 62.00,
                        costPrice: 52.00,
                        weight: '500 g',
                        stockQty: 60,
                        lowStockAlert: 10,
                        isDefault: true,
                        attributes: { weight: '500 g', packaging: 'Pouch' }
                    },
                    {
                        name: '1 kg Pouch',
                        sku: 'FORT-BESAN-1KG',
                        mrp: 135.00,
                        sellingPrice: 119.00,
                        costPrice: 100.00,
                        weight: '1 kg',
                        stockQty: 35,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '1 kg', packaging: 'Pouch' }
                    }
                ]
            },
            {
                title: 'Tata Sampann Pure Sooji (Semolina / Rava)',
                slug: 'tata-sampann-pure-sooji',
                unit: 'GRAM',
                isFeatured: false,
                isBestSeller: false,
                featuredImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Uniformly granulated wheat semolina for fluffy upma, halwa, and crispy rava dosas.',
                description: 'Tata Sampann Sooji is made from selected high-grade wheat grains. Processed without touch of hand to ensure pristine hygiene, consistent granules, and perfect roasting texture.',
                benefits: [
                    'Granulated texture ensures non-sticky cooking',
                    'Source of energy, protein, and dietary iron',
                    'No chemical additives or artificial polishing'
                ],
                tags: ['sooji', 'rava', 'semolina', 'tata sampann', 'halwa', 'upma'],
                howToUse: 'Dry roast on low flame before cooking sweet halwa or savory upma with mustard seeds and curry leaves.',
                variants: [
                    {
                        name: '500 g Pouch',
                        sku: 'TATA-SOOJI-500G',
                        mrp: 45.00,
                        sellingPrice: 38.00,
                        costPrice: 30.00,
                        weight: '500 g',
                        stockQty: 50,
                        lowStockAlert: 10,
                        isDefault: true,
                        attributes: { weight: '500 g' }
                    }
                ]
            }
        ]
    },
    {
        title: 'Dals & Pulses',
        slug: 'dals-pulses',
        description: 'Unpolished, farm-fresh dals and protein-rich pulses with no artificial stone or water polish.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        sortOrder: 2,
        items: [
            {
                title: 'Tata Sampann Unpolished Toor / Arhar Dal',
                slug: 'tata-sampann-unpolished-toor-dal',
                unit: 'KG',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Natural unpolished toor dal rich in natural protein for daily comforting dal tadka.',
                description: 'Tata Sampann Toor Dal undergoes a stringent 5-step quality check and does not undergo artificial stone, water, or oil polishing, retaining wholesome nutrition, natural yellow color, and taste.',
                benefits: [
                    'Unpolished: zero water, oil, or stone polish',
                    'Naturally rich in vegetable protein and dietary fibre',
                    'Quick cooking and easy to digest'
                ],
                tags: ['toor dal', 'arhar dal', 'tata sampann', 'pulses', 'dal tadka', 'protein'],
                howToUse: 'Wash thoroughly and pressure cook with turmeric, salt, and water for 3-4 whistles. Temper with cumin, garlic, and ghee.',
                faqs: [
                    { question: 'Why is unpolished dal better?', answer: 'Unpolished dal retains the natural grain layer, meaning higher dietary fibre, essential minerals, and authentic aroma.' }
                ],
                variants: [
                    {
                        name: '1 kg Pouch',
                        sku: 'TATA-TOOR-1KG',
                        mrp: 195.00,
                        sellingPrice: 172.00,
                        costPrice: 150.00,
                        weight: '1 kg',
                        stockQty: 75,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { weight: '1 kg' }
                    },
                    {
                        name: '500 g Pouch',
                        sku: 'TATA-TOOR-500G',
                        mrp: 105.00,
                        sellingPrice: 92.00,
                        costPrice: 80.00,
                        weight: '500 g',
                        stockQty: 45,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '500 g' }
                    }
                ]
            },
            {
                title: 'Tata Sampann Unpolished Moong Dal (Split / Dhuli)',
                slug: 'tata-sampann-unpolished-moong-dal',
                unit: 'KG',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Light and highly digestible yellow moong dal for khichdi and healthy soups.',
                description: 'Unpolished yellow moong dal from Tata Sampann is packed with wholesome natural proteins. Highly recommended for daily light meals, comforting khichdi, and moong dal cheela.',
                benefits: [
                    'Gentle on stomach and very easy to digest',
                    'High protein content supports muscle recovery',
                    'Free from synthetic additives and food coloring'
                ],
                tags: ['moong dal', 'yellow moong', 'khichdi', 'dal', 'healthy'],
                howToUse: 'Cook with mild spices for everyday dal or blend soaked moong for savory breakfast cheelas.',
                variants: [
                    {
                        name: '1 kg Pouch',
                        sku: 'TATA-MOONG-1KG',
                        mrp: 175.00,
                        sellingPrice: 155.00,
                        costPrice: 135.00,
                        weight: '1 kg',
                        stockQty: 60,
                        lowStockAlert: 10,
                        isDefault: true,
                        attributes: { weight: '1 kg' }
                    },
                    {
                        name: '500 g Pouch',
                        sku: 'TATA-MOONG-500G',
                        mrp: 90.00,
                        sellingPrice: 80.00,
                        costPrice: 70.00,
                        weight: '500 g',
                        stockQty: 40,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '500 g' }
                    }
                ]
            },
            {
                title: 'Organic Kabuli Chana (White Chickpeas / Safed Chole)',
                slug: 'organic-kabuli-chana-white-chickpeas',
                unit: 'KG',
                isFeatured: false,
                isBestSeller: false,
                featuredImage: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Jumbo-sized white chickpeas for delicious Punjabi Amritsari chole and Mediterranean hummus.',
                description: 'Premium quality Kabuli Chana featuring large bold grains. Soaks evenly and cooks to a buttery, velvety texture ideal for spicy chole bhature or fresh protein salads.',
                benefits: [
                    'Rich in plant protein, dietary fibre, and complex carbs',
                    'Low glycemic index promotes sustained satiety',
                    'Big uniform size with rich natural taste'
                ],
                tags: ['chana', 'chole', 'kabuli chana', 'chickpeas', 'punjabi chole'],
                howToUse: 'Soak overnight for 8 hours. Pressure cook with tea bag for dark tint or salt and cumin until tender.',
                variants: [
                    {
                        name: '1 kg Pouch',
                        sku: 'ORG-KABULI-1KG',
                        mrp: 170.00,
                        sellingPrice: 149.00,
                        costPrice: 125.00,
                        weight: '1 kg',
                        stockQty: 40,
                        lowStockAlert: 10,
                        isDefault: true,
                        attributes: { weight: '1 kg' }
                    },
                    {
                        name: '500 g Pouch',
                        sku: 'ORG-KABULI-500G',
                        mrp: 90.00,
                        sellingPrice: 78.00,
                        costPrice: 65.00,
                        weight: '500 g',
                        stockQty: 30,
                        lowStockAlert: 5,
                        isDefault: false,
                        attributes: { weight: '500 g' }
                    }
                ]
            }
        ]
    },
    {
        title: 'Rice & Rice Products',
        slug: 'rice-rice-products',
        description: 'Aromatic royal basmati, daily table rice, nutritious brown rice, and crisp thick poha.',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
        sortOrder: 3,
        items: [
            {
                title: 'Daawat Rozana Super Basmati Rice',
                slug: 'daawat-rozana-super-basmati-rice',
                unit: 'KG',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Aged long-grain basmati rice with irresistible aroma for everyday feast.',
                description: 'Daawat Rozana Super Basmati is aged to perfection. Each long and slender grain elongates upon cooking, remaining non-sticky and delightfully fluffy for daily pulao, jeera rice, and dal chawal.',
                benefits: [
                    'Naturally aged basmati grains for delightful aroma',
                    'Fluffy, non-sticky grains after cooking',
                    'Ideal everyday basmati for royal dining at home'
                ],
                tags: ['basmati rice', 'daawat', 'rice', 'pulao', 'biryani', 'staples'],
                howToUse: 'Wash gently and soak in water for 25-30 minutes before cooking with a 1:2 rice-to-water ratio.',
                variants: [
                    {
                        name: '5 kg Bag',
                        sku: 'DAAWAT-BASMATI-5KG',
                        mrp: 450.00,
                        sellingPrice: 389.00,
                        costPrice: 330.00,
                        weight: '5 kg',
                        stockQty: 60,
                        lowStockAlert: 10,
                        isDefault: true,
                        attributes: { weight: '5 kg', packaging: 'Bag' }
                    },
                    {
                        name: '1 kg Pouch',
                        sku: 'DAAWAT-BASMATI-1KG',
                        mrp: 98.00,
                        sellingPrice: 85.00,
                        costPrice: 72.00,
                        weight: '1 kg',
                        stockQty: 45,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '1 kg', packaging: 'Pouch' }
                    }
                ]
            },
            {
                title: 'Tata Sampann Thick Poha (Beaten Rice / Flattened Rice)',
                slug: 'tata-sampann-thick-poha',
                unit: 'GRAM',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Iron-rich wholesome thick poha that retains shape and does not turn mushy.',
                description: 'Tata Sampann Thick Poha is made from premium paddy grains. Cleaned and processed to high hygienic standards, it provides sustained energy and high natural iron for wholesome morning breakfasts.',
                benefits: [
                    'Naturally rich in dietary iron',
                    'Retains shape and crunch, does not turn mushy',
                    'Quick, wholesome breakfast ready in under 10 minutes'
                ],
                tags: ['poha', 'breakfast', 'tata sampann', 'flattened rice', 'kanda poha'],
                howToUse: 'Rinse under running water in a colander for 30 seconds. Drain completely before tossing with mustard seeds, peanuts, and onions.',
                variants: [
                    {
                        name: '500 g Pouch',
                        sku: 'TATA-POHA-500G',
                        mrp: 55.00,
                        sellingPrice: 46.00,
                        costPrice: 38.00,
                        weight: '500 g',
                        stockQty: 70,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { weight: '500 g' }
                    },
                    {
                        name: '1 kg Pouch',
                        sku: 'TATA-POHA-1KG',
                        mrp: 105.00,
                        sellingPrice: 88.00,
                        costPrice: 72.00,
                        weight: '1 kg',
                        stockQty: 35,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '1 kg' }
                    }
                ]
            }
        ]
    },
    {
        title: 'Edible Oils & Pure Ghee',
        slug: 'edible-oils-ghee',
        description: 'Pure desi ghee, heart-healthy sunflower oil, cold-pressed mustard oil, and cooking oils.',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
        sortOrder: 4,
        items: [
            {
                title: 'Fortune Sunlite Refined Sunflower Oil',
                slug: 'fortune-sunlite-sunflower-oil',
                unit: 'LITRE',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Light and healthy refined sunflower oil enriched with Vitamin A & D.',
                description: 'Fortune Sunlite Refined Sunflower Oil is a light, easy-to-digest cooking oil with a high smoke point. Enriched with Vitamins A and D, it helps maintain cardiovascular well-being while keeping food crispy and non-greasy.',
                benefits: [
                    'Enriched with essential Vitamins A and D',
                    'Light and easily digestible for everyday cooking',
                    'High smoke point ideal for sautéing and deep frying'
                ],
                tags: ['cooking oil', 'sunflower oil', 'fortune', 'oil', 'refined oil'],
                howToUse: 'Suitable for all types of Indian cooking, tempering, baking, and shallow frying.',
                variants: [
                    {
                        name: '1 Litre Pouch',
                        sku: 'FORT-SUN-1L-POUCH',
                        mrp: 165.00,
                        sellingPrice: 138.00,
                        costPrice: 120.00,
                        volume: 1.0,
                        stockQty: 90,
                        lowStockAlert: 20,
                        isDefault: true,
                        attributes: { volume: '1 Litre', packaging: 'Pouch' }
                    },
                    {
                        name: '5 Litre Jar',
                        sku: 'FORT-SUN-5L-JAR',
                        mrp: 810.00,
                        sellingPrice: 685.00,
                        costPrice: 610.00,
                        volume: 5.0,
                        stockQty: 30,
                        lowStockAlert: 5,
                        isDefault: false,
                        attributes: { volume: '5 Litre', packaging: 'Can' }
                    }
                ]
            },
            {
                title: 'Amul Pure Desi Ghee',
                slug: 'amul-pure-desi-ghee',
                unit: 'LITRE',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Traditional danedar desi ghee with authentic golden color and heavenly aroma.',
                description: 'Amul Ghee is made from fresh cream and has a typical rich aroma and granular texture. A rich source of Vitamin A, D, E and K, it adds traditional warmth and heavenly taste to rotis, dal, and sweets.',
                benefits: [
                    'Authentic granular (danedar) texture',
                    'Rich in natural fat-soluble Vitamins A, D, E & K',
                    'Boosts immunity, digestion, and traditional flavor'
                ],
                tags: ['ghee', 'desi ghee', 'amul', 'pure ghee', 'dairy', 'ayurvedic'],
                howToUse: 'Drizzle generously over warm rotis, khichdi, or use for tempering dal and preparing authentic sweets.',
                variants: [
                    {
                        name: '1 Litre Tin',
                        sku: 'AMUL-GHEE-1L-TIN',
                        mrp: 690.00,
                        sellingPrice: 630.00,
                        costPrice: 575.00,
                        volume: 1.0,
                        stockQty: 45,
                        lowStockAlert: 10,
                        isDefault: true,
                        attributes: { volume: '1 Litre', packaging: 'Tin' }
                    },
                    {
                        name: '500 ml Pouch',
                        sku: 'AMUL-GHEE-500ML',
                        mrp: 345.00,
                        sellingPrice: 318.00,
                        costPrice: 290.00,
                        volume: 0.5,
                        stockQty: 40,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { volume: '500 ml', packaging: 'Pouch' }
                    }
                ]
            },
            {
                title: 'Fortune Premium Kachi Ghani Pure Mustard Oil',
                slug: 'fortune-kachi-ghani-mustard-oil',
                unit: 'LITRE',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Traditional cold pressed kachi ghani sarson tel with strong pungency and aroma.',
                description: 'Extracted from the first press of high-grade mustard seeds using traditional cold-press technique. Retains natural pungency, rich Omega-3 fatty acids, and authentic taste for curries and pickles.',
                benefits: [
                    'Cold-pressed traditional Kachi Ghani process',
                    'Strong natural pungency and authentic aroma',
                    'Preserves pickles and boosts flavor of curries'
                ],
                tags: ['mustard oil', 'sarson oil', 'kachi ghani', 'fortune', 'oil'],
                howToUse: 'Heat until smoking point before adding spices to mellow the natural pungency for curries.',
                variants: [
                    {
                        name: '1 Litre Bottle',
                        sku: 'FORT-MUST-1L-BOT',
                        mrp: 175.00,
                        sellingPrice: 148.00,
                        costPrice: 130.00,
                        volume: 1.0,
                        stockQty: 65,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { volume: '1 Litre', packaging: 'Bottle' }
                    }
                ]
            }
        ]
    },
    {
        title: 'Spices, Masalas & Salt',
        slug: 'spices-masalas',
        description: 'Aromatic pure ground spices, whole seasonings, authentic recipe masalas, and iodised salt.',
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
        sortOrder: 5,
        items: [
            {
                title: 'Tata Salt (Desh Ka Namak) Vacuum Evaporated Iodised Salt',
                slug: 'tata-salt-iodised',
                unit: 'KG',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Vacuum evaporated iodised salt ensuring mental development and daily health.',
                description: 'Tata Salt is vacuum-evaporated and iodised under ultra-hygienic conditions. Delivers the right amount of iodine crucial for brain development in growing children and everyday nutritional balance.',
                benefits: [
                    'Vacuum evaporated for unmatched purity and zero dust',
                    'Adequate iodine guaranteed for healthy thyroid function',
                    'Consistently free-flowing crystals'
                ],
                tags: ['salt', 'namak', 'tata salt', 'iodised salt', 'staple', 'grocery'],
                howToUse: 'Add as per taste to curries, doughs, salads, and cooking.',
                variants: [
                    {
                        name: '1 kg Pack',
                        sku: 'TATA-SALT-1KG',
                        mrp: 28.00,
                        sellingPrice: 25.00,
                        costPrice: 21.00,
                        weight: '1 kg',
                        stockQty: 150,
                        lowStockAlert: 30,
                        isDefault: true,
                        attributes: { weight: '1 kg' }
                    }
                ]
            },
            {
                title: 'Everest Turmeric Powder (Haldi)',
                slug: 'everest-turmeric-powder-haldi',
                unit: 'GRAM',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Natural golden turmeric powder rich in active curcumin for color and immunity.',
                description: 'Everest Turmeric Powder is sourced from the finest turmeric rhizomes in Salem. Stone-ground at controlled temperatures to preserve the precious volatile oils and natural anti-inflammatory curcumin.',
                benefits: [
                    'High natural curcumin content',
                    'Vibrant sunny golden hue with earthy aroma',
                    'Supports immunity and natural wellness'
                ],
                tags: ['haldi', 'turmeric', 'everest', 'masala', 'spices', 'immunity'],
                howToUse: 'Use half a teaspoon in daily curries, dals, or mix with warm milk for traditional golden milk.',
                variants: [
                    {
                        name: '200 g Box',
                        sku: 'EVEREST-HALDI-200G',
                        mrp: 65.00,
                        sellingPrice: 56.00,
                        costPrice: 47.00,
                        weight: '200 g',
                        stockQty: 80,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { weight: '200 g' }
                    },
                    {
                        name: '500 g Box',
                        sku: 'EVEREST-HALDI-500G',
                        mrp: 155.00,
                        sellingPrice: 135.00,
                        costPrice: 115.00,
                        weight: '500 g',
                        stockQty: 45,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '500 g' }
                    }
                ]
            },
            {
                title: 'MDH Deggi Mirch (Rich Red Pepper Powder)',
                slug: 'mdh-deggi-mirch',
                unit: 'GRAM',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Unique blend of Kashmiri chillies imparting glowing natural red color without excessive heat.',
                description: 'MDH Deggi Mirch is a legendary blend of Indian red capsicums and Kashmiri red chillies. Gives gravies and tandoori marinades a luscious scarlet hue and mild, appetizing warmth.',
                benefits: [
                    'Imparts brilliant natural red color to gravies',
                    'Moderate spice level suitable for whole family',
                    'Authentic MDH secret recipe'
                ],
                tags: ['deggi mirch', 'chilli powder', 'mdh', 'spices', 'red chilli'],
                howToUse: 'Add to hot oil along with ginger-garlic paste for maximum color extraction.',
                variants: [
                    {
                        name: '100 g Box',
                        sku: 'MDH-MIRCH-100G',
                        mrp: 88.00,
                        sellingPrice: 78.00,
                        costPrice: 65.00,
                        weight: '100 g',
                        stockQty: 70,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { weight: '100 g' }
                    }
                ]
            }
        ]
    },
    {
        title: 'Dairy & Bakery Essentials',
        slug: 'dairy-bakery',
        description: 'Fresh pasteurised butter, malai paneer, long-life toned milk, and daily bakery favorites.',
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
        sortOrder: 6,
        items: [
            {
                title: 'Amul Butter - Pasteurised',
                slug: 'amul-butter-pasteurised',
                unit: 'GRAM',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Utterly butterly delicious creamy salted butter loved across Indian households.',
                description: 'Amul Butter is made from pure fresh milk cream. Salted and churned to perfection, it is the iconic breakfast companion for toast, parathas, pav bhaji, and gourmet cooking.',
                benefits: [
                    '100% wholesome pure dairy cream butter',
                    'Enriched with Vitamin A',
                    'Unbeatable rich creamy taste'
                ],
                tags: ['amul butter', 'butter', 'dairy', 'breakfast', 'bread butter'],
                howToUse: 'Spread generously on warm toast or melt over piping hot pav bhaji and stuffed parathas.',
                variants: [
                    {
                        name: '100 g Pack',
                        sku: 'AMUL-BUTTER-100G',
                        mrp: 58.00,
                        sellingPrice: 56.00,
                        costPrice: 50.00,
                        weight: '100 g',
                        stockQty: 80,
                        lowStockAlert: 20,
                        isDefault: true,
                        attributes: { weight: '100 g' }
                    },
                    {
                        name: '500 g Pack',
                        sku: 'AMUL-BUTTER-500G',
                        mrp: 275.00,
                        sellingPrice: 265.00,
                        costPrice: 240.00,
                        weight: '500 g',
                        stockQty: 40,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '500 g' }
                    }
                ]
            },
            {
                title: 'Amul Malai Fresh Paneer',
                slug: 'amul-malai-fresh-paneer',
                unit: 'GRAM',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Melt-in-mouth soft and succulent malai paneer for curries and tikka.',
                description: 'Amul Fresh Malai Paneer is prepared from pasteurised milk under strict automated hygienic processing. Blocks are soft, juicy, and retain their shape without turning rubbery during cooking.',
                benefits: [
                    'High in milk protein and calcium',
                    'Vacuum packed to preserve fresh milky sweetness',
                    'Stays tender and juicy inside gravies'
                ],
                tags: ['paneer', 'cottage cheese', 'amul', 'malai paneer', 'dairy', 'protein'],
                howToUse: 'Dice into cubes and submerge in warm salted water for 5 minutes before tossing in palak paneer or shahi gravy.',
                variants: [
                    {
                        name: '200 g Pack',
                        sku: 'AMUL-PANEER-200G',
                        mrp: 95.00,
                        sellingPrice: 89.00,
                        costPrice: 78.00,
                        weight: '200 g',
                        stockQty: 50,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { weight: '200 g' }
                    }
                ]
            },
            {
                title: 'Amul Taaza Homogenised Toned Milk (Tetra Pak)',
                slug: 'amul-taaza-toned-milk-tetra',
                unit: 'LITRE',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Long shelf life UHT treated toned milk, safe to drink directly with no boiling.',
                description: 'Amul Taaza Toned Milk undergoes Ultra High Temperature (UHT) treatment and aseptic packaging in 6-layer Tetra Pak cartons. Requires no boiling and stays fresh at room temperature until opened.',
                benefits: [
                    'Zero preservatives with 100% pure milk assurance',
                    'No refrigeration required prior to opening carton',
                    'Balanced 3.0% fat and 8.5% SNF'
                ],
                tags: ['milk', 'amul taaza', 'toned milk', 'tetra pak', 'dairy'],
                howToUse: 'Cut open and drink directly or use for tea, coffee, breakfast cereals, and desserts.',
                variants: [
                    {
                        name: '1 Litre Tetra Pak',
                        sku: 'AMUL-TAAZA-1L',
                        mrp: 74.00,
                        sellingPrice: 70.00,
                        costPrice: 62.00,
                        volume: 1.0,
                        stockQty: 70,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { volume: '1 Litre', packaging: 'Tetra Pak' }
                    }
                ]
            }
        ]
    },
    {
        title: 'Snacks, Biscuits & Namkeen',
        slug: 'snacks-namkeen',
        description: 'Crispy namkeens, timeless tea biscuits, crunch chips, and family snack bites.',
        imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&auto=format&fit=crop&q=80',
        sortOrder: 7,
        items: [
            {
                title: 'Parle-G Original Gluco Biscuits',
                slug: 'parle-g-original-gluco-biscuits',
                unit: 'PACK',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'The iconic glucose biscuit that has fueled millions of Indians with chai.',
                description: 'Filled with the wholesome goodness of wheat and milk, Parle-G has been an indispensable part of Indian households since 1939. Provides delicious nourishment and instant energy with every dip.',
                benefits: [
                    'Wholesome goodness of milk and wheat',
                    'Instant source of glucose energy',
                    'Perfect tea and coffee companion'
                ],
                tags: ['parle g', 'biscuits', 'glucose biscuit', 'chai snack', 'kirana'],
                howToUse: 'Dip in hot tea or coffee or enjoy crunchy straight out of the wrapper.',
                variants: [
                    {
                        name: '800 g Family Pack',
                        sku: 'PARLEG-800G',
                        mrp: 90.00,
                        sellingPrice: 79.00,
                        costPrice: 68.00,
                        weight: '800 g',
                        stockQty: 85,
                        lowStockAlert: 20,
                        isDefault: true,
                        attributes: { weight: '800 g' }
                    },
                    {
                        name: '250 g Pack',
                        sku: 'PARLEG-250G',
                        mrp: 30.00,
                        sellingPrice: 27.00,
                        costPrice: 22.00,
                        weight: '250 g',
                        stockQty: 100,
                        lowStockAlert: 25,
                        isDefault: false,
                        attributes: { weight: '250 g' }
                    }
                ]
            },
            {
                title: "Haldiram's Nagpur Bhujia Sev",
                slug: 'haldirams-nagpur-bhujia-sev',
                unit: 'GRAM',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Crispy, spiced moth bean bhujia with legendary Bikaneri crunch.',
                description: "Haldiram's Bhujia Sev is prepared using high quality tepary moth beans and gram flour blended with select Rajasthani spices. Incredibly crispy, spicy, and addictive.",
                benefits: [
                    'Authentic Rajasthani recipe with moth flour',
                    'Crispy, zesty, and zero trans fats',
                    'Top choice for topping chaats, poha, and sandwiches'
                ],
                tags: ['haldirams', 'bhujia', 'sev', 'namkeen', 'snacks'],
                howToUse: 'Enjoy as evening tea snack or sprinkle over poha, upma, and bhel puri for extra crunch.',
                variants: [
                    {
                        name: '400 g Pack',
                        sku: 'HALD-BHUJIA-400G',
                        mrp: 130.00,
                        sellingPrice: 115.00,
                        costPrice: 98.00,
                        weight: '400 g',
                        stockQty: 60,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { weight: '400 g' }
                    },
                    {
                        name: '1 kg Value Pack',
                        sku: 'HALD-BHUJIA-1KG',
                        mrp: 295.00,
                        sellingPrice: 260.00,
                        costPrice: 225.00,
                        weight: '1 kg',
                        stockQty: 30,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '1 kg' }
                    }
                ]
            },
            {
                title: 'Britannia Good Day Butter Cookies',
                slug: 'britannia-good-day-butter-cookies',
                unit: 'PACK',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Rich buttery cookies with iconic smile ridges for joyful snacking.',
                description: 'Britannia Good Day Butter Cookies bring delight to everyday moments with rich buttery flavor and crunchy texture that melts gently in your mouth.',
                benefits: [
                    'Rich butter indulgence in every bite',
                    'Delightful crunchy smile pattern',
                    'Loved by kids and adults alike'
                ],
                tags: ['good day', 'butter cookies', 'britannia', 'biscuits', 'snack'],
                howToUse: 'Pair with warm masala chai or a glass of cold milk.',
                variants: [
                    {
                        name: '600 g Saver Pack',
                        sku: 'GD-BUTTER-600G',
                        mrp: 140.00,
                        sellingPrice: 120.00,
                        costPrice: 102.00,
                        weight: '600 g',
                        stockQty: 55,
                        lowStockAlert: 10,
                        isDefault: true,
                        attributes: { weight: '600 g' }
                    }
                ]
            }
        ]
    },
    {
        title: 'Beverages, Tea & Coffee',
        slug: 'beverages-tea-coffee',
        description: 'Rich Assam CTC tea, aromatic instant coffee, chocolate malt drinks, and herbal teas.',
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
        sortOrder: 8,
        items: [
            {
                title: 'Tata Tea Gold - Leaf & Gently Rolled Long Leaves',
                slug: 'tata-tea-gold-leaf',
                unit: 'GRAM',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Exquisite blend of 85% Assam CTC teas and 15% long aroma tea leaves.',
                description: 'Tata Tea Gold delivers a matchless cup of chai with the perfect harmony of rich taste and irresistible aroma. Specially crafted for chai lovers who desire kadak strength and captivating fragrance.',
                benefits: [
                    'Blend of strong CTC granules and gentle long rolled orthodox leaves',
                    'Unmatched aroma and rich amber color',
                    'Rejuvenating refreshment in every sip'
                ],
                tags: ['tea', 'chai', 'tata tea', 'tata tea gold', 'kadak chai'],
                howToUse: 'Boil water and milk in 1:1 proportion, add 1 tsp tea leaves and sugar. Simmer for 3 minutes and strain.',
                variants: [
                    {
                        name: '500 g Pack',
                        sku: 'TATA-TEA-500G',
                        mrp: 325.00,
                        sellingPrice: 285.00,
                        costPrice: 245.00,
                        weight: '500 g',
                        stockQty: 75,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { weight: '500 g' }
                    },
                    {
                        name: '1 kg Pack',
                        sku: 'TATA-TEA-1KG',
                        mrp: 620.00,
                        sellingPrice: 545.00,
                        costPrice: 470.00,
                        weight: '1 kg',
                        stockQty: 35,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '1 kg' }
                    },
                    {
                        name: '250 g Pack',
                        sku: 'TATA-TEA-250G',
                        mrp: 170.00,
                        sellingPrice: 150.00,
                        costPrice: 128.00,
                        weight: '250 g',
                        stockQty: 50,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '250 g' }
                    }
                ]
            },
            {
                title: 'Nescafé Classic 100% Pure Instant Coffee',
                slug: 'nescafe-classic-instant-coffee',
                unit: 'GRAM',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: '100% pure Robusta coffee granules delivering unmistakable bold taste and aroma.',
                description: 'Nescafé Classic is roasted to a medium-dark profile to bring out the deepest aroma. Instantly dissolves in hot or cold milk to kickstart mornings with bold coffee power.',
                benefits: [
                    '100% pure natural coffee beans',
                    'Intense aroma and bold satisfying flavor',
                    'Versatile for hot frothy latte or refreshing iced cold coffee'
                ],
                tags: ['nescafe', 'coffee', 'instant coffee', 'beverages'],
                howToUse: 'Add 1 teaspoon coffee and sugar to warm milk. Whisk for a thick froth.',
                variants: [
                    {
                        name: '100 g Glass Jar',
                        sku: 'NESCAFE-100G-JAR',
                        mrp: 360.00,
                        sellingPrice: 320.00,
                        costPrice: 280.00,
                        weight: '100 g',
                        stockQty: 45,
                        lowStockAlert: 10,
                        isDefault: true,
                        attributes: { weight: '100 g', packaging: 'Glass Jar' }
                    },
                    {
                        name: '50 g Glass Jar',
                        sku: 'NESCAFE-50G-JAR',
                        mrp: 195.00,
                        sellingPrice: 175.00,
                        costPrice: 150.00,
                        weight: '50 g',
                        stockQty: 50,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '50 g', packaging: 'Glass Jar' }
                    }
                ]
            }
        ]
    },
    {
        title: 'Sugar, Jaggery & Sweeteners',
        slug: 'sugar-jaggery',
        description: 'Sulphurless sparkling white sugar, organic desi jaggery cubes, and pure raw honey.',
        imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80',
        sortOrder: 9,
        items: [
            {
                title: 'Madhur Pure & Hygienic Sulphurless Sugar',
                slug: 'madhur-pure-sulphurless-sugar',
                unit: 'KG',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: '100% sulphur-free refined white sugar untouched by human hands.',
                description: 'Madhur Sugar is refined using a modern sulphur-free process. Pristine white crystals dissolve uniformly in beverages and Indian desserts without any chemical aftertaste.',
                benefits: [
                    '100% sulphur-free refining',
                    'Completely untouched by human hands',
                    'Sparkling white, even crystal size'
                ],
                tags: ['sugar', 'cheeni', 'madhur', 'sweeteners', 'kirana', 'grocery'],
                howToUse: 'Sweeten tea, coffee, puddings, juices, and traditional festive mithais.',
                variants: [
                    {
                        name: '1 kg Pack',
                        sku: 'MADHUR-SUGAR-1KG',
                        mrp: 65.00,
                        sellingPrice: 56.00,
                        costPrice: 48.00,
                        weight: '1 kg',
                        stockQty: 110,
                        lowStockAlert: 20,
                        isDefault: true,
                        attributes: { weight: '1 kg' }
                    },
                    {
                        name: '5 kg Pack',
                        sku: 'MADHUR-SUGAR-5KG',
                        mrp: 315.00,
                        sellingPrice: 275.00,
                        costPrice: 235.00,
                        weight: '5 kg',
                        stockQty: 40,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '5 kg' }
                    }
                ]
            },
            {
                title: 'Kolhapuri Organic Desi Jaggery (Gud) Cubes',
                slug: 'kolhapuri-desi-jaggery-gud-cubes',
                unit: 'GRAM',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Chemical-free unrefined sugarcane jaggery cubes packed with natural iron.',
                description: 'Authentic Kolhapuri Gud produced from freshly crushed sugarcane juice without chemical bleaching or synthetic colorants. Convenient bite-sized cubes for daily post-meal digestive treats or healthy tea sweetening.',
                benefits: [
                    'Rich in natural iron and essential mineral salts',
                    'Aids digestion when consumed after meals',
                    'Pure chemical-free processing'
                ],
                tags: ['jaggery', 'gud', 'organic', 'healthy sweetener', 'ayurveda'],
                howToUse: 'Add to herbal teas or have a small cube post meals for digestion.',
                variants: [
                    {
                        name: '1 kg Pack',
                        sku: 'GUD-CUBES-1KG',
                        mrp: 110.00,
                        sellingPrice: 92.00,
                        costPrice: 78.00,
                        weight: '1 kg',
                        stockQty: 50,
                        lowStockAlert: 10,
                        isDefault: true,
                        attributes: { weight: '1 kg' }
                    },
                    {
                        name: '500 g Pack',
                        sku: 'GUD-CUBES-500G',
                        mrp: 60.00,
                        sellingPrice: 50.00,
                        costPrice: 42.00,
                        weight: '500 g',
                        stockQty: 40,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '500 g' }
                    }
                ]
            },
            {
                title: 'Dabur 100% Pure Honey',
                slug: 'dabur-100-percent-pure-honey',
                unit: 'GRAM',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'NMR tested 100% pure natural honey for immunity and healthy weight management.',
                description: 'Dabur Honey is sourced straight from sundarbans and pristine valleys. Clears all 22 purity tests including Nuclear Magnetic Resonance (NMR) with zero sugar adulteration.',
                benefits: [
                    '100% pure & NMR tested',
                    'Natural antioxidant and immunity builder',
                    'Helps soothe throat irritation and aids weight management'
                ],
                tags: ['honey', 'dabur honey', 'pure honey', 'immunity', 'weight loss'],
                howToUse: 'Mix 1 tablespoon in lukewarm water with fresh lemon juice every morning.',
                variants: [
                    {
                        name: '500 g Squeezy Bottle',
                        sku: 'DABUR-HONEY-500G',
                        mrp: 240.00,
                        sellingPrice: 205.00,
                        costPrice: 175.00,
                        weight: '500 g',
                        stockQty: 50,
                        lowStockAlert: 10,
                        isDefault: true,
                        attributes: { weight: '500 g', packaging: 'Squeezy' }
                    }
                ]
            }
        ]
    },
    {
        title: 'Instant Food & Noodles',
        slug: 'instant-food-noodles',
        description: '2-Minute instant noodles, quick breakfast vermicelli, ready-to-eat pasta, and soups.',
        imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
        sortOrder: 10,
        items: [
            {
                title: 'Maggi 2-Minute Masala Instant Noodles',
                slug: 'maggi-2-minute-masala-noodles',
                unit: 'PACK',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'India’s favorite 2-minute instant noodles with the signature aromatic masala tastemaker.',
                description: 'Maggi Masala Noodles are crafted with quality roasted spices like coriander, cumin, ginger, and turmeric. A comfort meal ready in just two minutes, fortified with iron.',
                benefits: [
                    'Fortified with dietary iron',
                    'Classic secret tastemaker with 10 roasted Indian spices',
                    'Quick comfort snack ready in 2 minutes'
                ],
                tags: ['maggi', 'instant noodles', 'noodles', 'snack', 'masala noodles'],
                howToUse: 'Break the noodle cake into 210 ml boiling water. Add the tastemaker, cook for 2 minutes stirring occasionally.',
                variants: [
                    {
                        name: 'Pack of 4 (280 g)',
                        sku: 'MAGGI-4PACK-280G',
                        mrp: 56.00,
                        sellingPrice: 52.00,
                        costPrice: 45.00,
                        weight: '280 g',
                        stockQty: 90,
                        lowStockAlert: 20,
                        isDefault: true,
                        attributes: { count: '4 Pack', weight: '280 g' }
                    },
                    {
                        name: 'Pack of 8 (560 g)',
                        sku: 'MAGGI-8PACK-560G',
                        mrp: 112.00,
                        sellingPrice: 99.00,
                        costPrice: 86.00,
                        weight: '560 g',
                        stockQty: 60,
                        lowStockAlert: 15,
                        isDefault: false,
                        attributes: { count: '8 Pack', weight: '560 g' }
                    }
                ]
            },
            {
                title: 'Sunfeast YiPPee! Magic Masala Noodles',
                slug: 'sunfeast-yippee-magic-masala-noodles',
                unit: 'PACK',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Non-sticky round block noodles with real vegetable bits and magical masala flavor.',
                description: 'YiPPee! noodles feature long non-sticky slurpy strands that stay intact even after cooling. Enriched with real veggies and vibrant spice blend.',
                benefits: [
                    'Round noodle block requires no breaking for long slurpy noodles',
                    'Non-sticky texture with real dehydrated vegetables',
                    'Source of 5 essential nutrients'
                ],
                tags: ['yippee', 'noodles', 'magic masala', 'sunfeast', 'instant food'],
                howToUse: 'Drop round block whole into boiling water with masala mix. Cook for 3 minutes.',
                variants: [
                    {
                        name: 'Pack of 4 (240 g)',
                        sku: 'YIPPEE-4PACK-240G',
                        mrp: 52.00,
                        sellingPrice: 47.00,
                        costPrice: 40.00,
                        weight: '240 g',
                        stockQty: 65,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { count: '4 Pack', weight: '240 g' }
                    }
                ]
            }
        ]
    },
    {
        title: 'Personal Care & Hygiene',
        slug: 'personal-care',
        description: 'Bathing soaps, cavity protection toothpastes, herbal shampoos, and hygiene products.',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
        sortOrder: 11,
        items: [
            {
                title: 'Dettol Original Germ Protection Bathing Soap',
                slug: 'dettol-original-bathing-soap',
                unit: 'PACK',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1607006314177-3e1fb33ff984?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1607006314177-3e1fb33ff984?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Trusted antiseptic bathing soap bar protecting your family against 100 illness-causing germs.',
                description: 'Dettol Original Soap provides trusted germ protection with its distinct pine fragrance. Cleanses deeply while preserving skin moisture, keeping your whole family feeling healthy and invigorated.',
                benefits: [
                    'Protects from 100 illness-causing germs',
                    'Trusted by doctors and the Indian Medical Association',
                    'Classic crisp pine freshness with added glycerin'
                ],
                tags: ['dettol', 'soap', 'bathing soap', 'germ protection', 'hygiene'],
                howToUse: 'Rub on wet body to produce rich creamy lather. Rinse thoroughly with water.',
                variants: [
                    {
                        name: 'Pack of 4 + 1 Free (125 g each)',
                        sku: 'DETTOL-SOAP-5PACK',
                        mrp: 245.00,
                        sellingPrice: 210.00,
                        costPrice: 180.00,
                        weight: '625 g',
                        stockQty: 55,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { packSize: '5 x 125g' }
                    },
                    {
                        name: 'Pack of 3 (75 g each)',
                        sku: 'DETTOL-SOAP-3PACK',
                        mrp: 110.00,
                        sellingPrice: 98.00,
                        costPrice: 85.00,
                        weight: '225 g',
                        stockQty: 60,
                        lowStockAlert: 15,
                        isDefault: false,
                        attributes: { packSize: '3 x 75g' }
                    }
                ]
            },
            {
                title: 'Colgate Strong Teeth Dental Cream Toothpaste',
                slug: 'colgate-strong-teeth-toothpaste',
                unit: 'GRAM',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1559591937-e62fb3d8d4ac?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1559591937-e62fb3d8d4ac?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Amino Shakti technology boosts natural calcium absorption for 2x stronger teeth.',
                description: 'Colgate Strong Teeth with Amino Shakti formula adds natural calcium to your teeth, making enamel 2x stronger against tooth decay. Provides clean teeth and all-day fresh breath.',
                benefits: [
                    'Amino Shakti adds natural calcium to teeth',
                    'Prevents cavities, plaque build-up, and bad breath',
                    'IDA (Indian Dental Association) accepted'
                ],
                tags: ['toothpaste', 'colgate', 'dental care', 'oral hygiene', 'brush'],
                howToUse: 'Brush thoroughly at least twice a day or as directed by a dentist.',
                variants: [
                    {
                        name: '500 g Saver Twin Pack (2 x 250 g)',
                        sku: 'COLGATE-500G-SAVER',
                        mrp: 260.00,
                        sellingPrice: 225.00,
                        costPrice: 195.00,
                        weight: '500 g',
                        stockQty: 50,
                        lowStockAlert: 10,
                        isDefault: true,
                        attributes: { weight: '500 g' }
                    },
                    {
                        name: '150 g Tube',
                        sku: 'COLGATE-150G-TUBE',
                        mrp: 95.00,
                        sellingPrice: 85.00,
                        costPrice: 72.00,
                        weight: '150 g',
                        stockQty: 75,
                        lowStockAlert: 20,
                        isDefault: false,
                        attributes: { weight: '150 g' }
                    }
                ]
            }
        ]
    },
    {
        title: 'Household & Cleaning Essentials',
        slug: 'household-cleaning',
        description: 'Tough stain removing detergents, sparkling dishwash liquids, and surface disinfectant cleaners.',
        imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&auto=format&fit=crop&q=80',
        sortOrder: 12,
        items: [
            {
                title: 'Surf Excel Quick Wash Detergent Powder',
                slug: 'surf-excel-quick-wash-detergent',
                unit: 'KG',
                isFeatured: true,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Super-efficient X-tra Clean particles erase tough stains like grease, ink, and tea.',
                description: 'Surf Excel Quick Wash is powered by advanced enzyme technology. Produces deep-cleaning lather that lifts stubborn grime from collars and cuffs with zero vigorous scrubbing.',
                benefits: [
                    'Removes 10 tough stains effortlessly',
                    'Dissolves fast and lathers rich in handwash and top-load machines',
                    'Maintains vibrancy of bright and dark fabrics'
                ],
                tags: ['surf excel', 'detergent', 'washing powder', 'laundry', 'stain removal'],
                howToUse: 'Add 1 scoop to a bucket of water or washing machine dispenser. Soak clothes for 30 minutes.',
                variants: [
                    {
                        name: '1 kg Poly Pack',
                        sku: 'SURF-QUICK-1KG',
                        mrp: 160.00,
                        sellingPrice: 142.00,
                        costPrice: 122.00,
                        weight: '1 kg',
                        stockQty: 80,
                        lowStockAlert: 20,
                        isDefault: true,
                        attributes: { weight: '1 kg' }
                    },
                    {
                        name: '3 kg Value Pack',
                        sku: 'SURF-QUICK-3KG',
                        mrp: 475.00,
                        sellingPrice: 410.00,
                        costPrice: 355.00,
                        weight: '3 kg',
                        stockQty: 40,
                        lowStockAlert: 10,
                        isDefault: false,
                        attributes: { weight: '3 kg' }
                    }
                ]
            },
            {
                title: 'Vim Lemon Dishwash Liquid Gel',
                slug: 'vim-lemon-dishwash-gel',
                unit: 'LITRE',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Power of 100 lemons cuts through burnt grease, leaving sparkling clean utensils without scratches.',
                description: 'Vim Dishwash Gel is formulated with genuine lemon extracts. Just one small spoonful in a bowl of water cleans an entire sink full of oily dishes without leaving white chalky film.',
                benefits: [
                    'Real lemon extracts break down greasy curries and burnt oils',
                    'Leaves zero scratch marks on non-stick cookware or glass',
                    'Pleasant refreshing citrus scent'
                ],
                tags: ['vim gel', 'dishwash', 'utensil cleaner', 'lemon', 'cleaning'],
                howToUse: 'Mix 1 teaspoon (4 ml) in a small bowl of water. Dip scrubber and wash utensils.',
                variants: [
                    {
                        name: '750 ml Bottle',
                        sku: 'VIM-GEL-750ML',
                        mrp: 175.00,
                        sellingPrice: 149.00,
                        costPrice: 128.00,
                        volume: 0.75,
                        stockQty: 70,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { volume: '750 ml', packaging: 'Bottle' }
                    },
                    {
                        name: '2 Litre Can Refill',
                        sku: 'VIM-GEL-2L-CAN',
                        mrp: 420.00,
                        sellingPrice: 360.00,
                        costPrice: 310.00,
                        volume: 2.0,
                        stockQty: 30,
                        lowStockAlert: 8,
                        isDefault: false,
                        attributes: { volume: '2 Litre', packaging: 'Can' }
                    }
                ]
            },
            {
                title: 'Harpic Power Plus 10X Toilet Cleaner (Original)',
                slug: 'harpic-power-plus-toilet-cleaner',
                unit: 'LITRE',
                isFeatured: false,
                isBestSeller: true,
                featuredImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
                images: [
                    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80'
                ],
                shortDescription: 'Thick liquid formula removing 100% limescale and eliminating 99.9% germs.',
                description: 'Harpic Power Plus is the all-in-one solution for your toilet. Its thick blue liquid clings tightly to vertical toilet bowl surfaces to dissolve stubborn yellow stains and kill odor-causing germs.',
                benefits: [
                    '10x better yellowish stain and limescale removal',
                    'Kills 99.9% of germs and bacteria',
                    'Angled nozzle reaches deep under the bowl rim'
                ],
                tags: ['harpic', 'toilet cleaner', 'bathroom cleaning', 'disinfectant'],
                howToUse: 'Squeeze under rim and around bowl. Leave for 20 minutes, brush lightly and flush.',
                variants: [
                    {
                        name: '1 Litre Bottle',
                        sku: 'HARPIC-1L-BOT',
                        mrp: 215.00,
                        sellingPrice: 185.00,
                        costPrice: 158.00,
                        volume: 1.0,
                        stockQty: 60,
                        lowStockAlert: 15,
                        isDefault: true,
                        attributes: { volume: '1 Litre' }
                    },
                    {
                        name: '500 ml Bottle',
                        sku: 'HARPIC-500ML-BOT',
                        mrp: 115.00,
                        sellingPrice: 102.00,
                        costPrice: 88.00,
                        volume: 0.5,
                        stockQty: 50,
                        lowStockAlert: 15,
                        isDefault: false,
                        attributes: { volume: '500 ml' }
                    }
                ]
            }
        ]
    }
];

// ==========================================
// Main Seeder Function
// ==========================================
async function main() {
    console.log('🚀 Starting Kirana Store database seeding...');

    // 1. Resolve Target Shopkeeper (cfda4f19-2e55-4adf-a925-72ee9e6b6b7c)
    const targetShopkeeperId = process.env.TARGET_SHOPKEEPER_ID || 'cfda4f19-2e55-4adf-a925-72ee9e6b6b7c';

    let shopkeeper = await prisma.shopkeeper.findUnique({
        where: { id: targetShopkeeperId },
        include: { user: true }
    });

    if (!shopkeeper) {
        console.log(`Target shopkeeper ${targetShopkeeperId} not found, looking for fallback...`);
        shopkeeper = await prisma.shopkeeper.findFirst({
            include: { user: true }
        });
    }

    if (!shopkeeper) {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@nidhi.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const adminName = process.env.ADMIN_NAME || 'Nidhi Admin';
        const adminPhone = process.env.ADMIN_PHONE || '9876543210';
        const shopName = process.env.ADMIN_SHOP_NAME || 'Nidhi Kirana Store';

        console.log(`Creating initial admin user & shopkeeper: ${adminEmail}...`);
        const user = await prisma.user.create({
            data: {
                email: adminEmail,
                password: adminPassword,
                name: adminName,
                phone: adminPhone,
                profileimage: '',
                shopkeeper: {
                    create: {
                        id: targetShopkeeperId,
                        shopname: shopName,
                        shopaddress: {
                            create: {
                                city: 'Delhi',
                                state: 'Delhi',
                                pincode: '110001',
                                flatnumber: 101,
                            },
                        },
                    },
                },
            },
            include: { shopkeeper: true }
        });
        shopkeeper = user.shopkeeper;
    }

    const shopkeeperId = shopkeeper.id;
    console.log(`✅ Using Target Shopkeeper: "${shopkeeper.shopname}" (ID: ${shopkeeperId})`);

    // Ensure all existing categories and items in DB point to this target shopkeeper
    console.log(`🔄 Updating existing Categories and Products in DB to shopkeeper: ${shopkeeperId}...`);
    await prisma.category.updateMany({
        data: { shopkeeperId: shopkeeperId }
    });
    await prisma.item.updateMany({
        data: { shopkeeperId: shopkeeperId }
    });

    // 2. Seed Platform Settings
    console.log('⚙️  Configuring default platform settings...');
    await prisma.platformSetting.upsert({
        where: { id: 'default' },
        update: {
            shippingCharge: 40.00,
            platformFee: 5.00
        },
        create: {
            id: 'default',
            shippingCharge: 40.00,
            platformFee: 5.00
        }
    });

    // 3. Seed Promotional Coupons
    console.log('🎟️  Seeding coupons...');
    const couponsToSeed = [
        {
            code: 'FREESHIP500',
            description: 'Free shipping on grocery orders above ₹500',
            discountType: 'FREE_SHIPPING',
            discountValue: 0,
            minOrderAmount: 500,
            status: 'ACTIVE'
        },
        {
            code: 'KIRANA50',
            description: 'Flat ₹50 off on grocery orders above ₹499',
            discountType: 'FLAT',
            discountValue: 50,
            minOrderAmount: 499,
            status: 'ACTIVE'
        },
        {
            code: 'WELCOME10',
            description: '10% discount for first-time customers up to ₹100',
            discountType: 'PERCENTAGE',
            discountValue: 10,
            minOrderAmount: 299,
            maxDiscountAmount: 100,
            isFirstOrder: true,
            status: 'ACTIVE'
        }
    ];

    for (const c of couponsToSeed) {
        await prisma.coupon.upsert({
            where: { code: c.code },
            update: c,
            create: c
        });
    }

    // 4. Seed Kirana Categories, Products & Variants
    console.log(`📦 Seeding ${kiranaCatalog.length} kirana categories with authentic products...`);
    let categoryCount = 0;
    let itemCount = 0;
    let variantCount = 0;

    for (const catData of kiranaCatalog) {
        // Upsert Category with shopkeeperId
        const category = await prisma.category.upsert({
            where: { slug: catData.slug },
            update: {
                title: catData.title,
                description: catData.description,
                imageUrl: catData.imageUrl,
                sortOrder: catData.sortOrder,
                isActive: true,
                shopkeeperId: shopkeeperId
            },
            create: {
                title: catData.title,
                slug: catData.slug,
                description: catData.description,
                imageUrl: catData.imageUrl,
                sortOrder: catData.sortOrder,
                isActive: true,
                shopkeeperId: shopkeeperId
            }
        });
        categoryCount++;

        // Process Items in this Category
        for (const itemData of catData.items) {
            // Upsert Item with shopkeeperId
            const item = await prisma.item.upsert({
                where: { slug: itemData.slug },
                update: {
                    title: itemData.title,
                    description: itemData.description,
                    shortDescription: itemData.shortDescription,
                    unit: itemData.unit,
                    featuredImage: itemData.featuredImage,
                    images: itemData.images,
                    isFeatured: itemData.isFeatured || false,
                    isBestSeller: itemData.isBestSeller || false,
                    benefits: itemData.benefits || [],
                    tags: itemData.tags || [],
                    howToUse: itemData.howToUse || null,
                    isActive: true,
                    availability: 'In Stock',
                    categoryId: category.id,
                    shopkeeperId: shopkeeperId
                },
                create: {
                    title: itemData.title,
                    slug: itemData.slug,
                    description: itemData.description,
                    shortDescription: itemData.shortDescription,
                    unit: itemData.unit,
                    featuredImage: itemData.featuredImage,
                    images: itemData.images,
                    isFeatured: itemData.isFeatured || false,
                    isBestSeller: itemData.isBestSeller || false,
                    benefits: itemData.benefits || [],
                    tags: itemData.tags || [],
                    howToUse: itemData.howToUse || null,
                    isActive: true,
                    availability: 'In Stock',
                    categoryId: category.id,
                    shopkeeperId: shopkeeperId
                }
            });
            itemCount++;

            // Seed FAQs if provided
            if (itemData.faqs && itemData.faqs.length > 0) {
                for (let idx = 0; idx < itemData.faqs.length; idx++) {
                    const faq = itemData.faqs[idx];
                    const existingFaq = await prisma.productFaq.findFirst({
                        where: { productId: item.id, question: faq.question }
                    });
                    if (existingFaq) {
                        await prisma.productFaq.update({
                            where: { id: existingFaq.id },
                            data: { answer: faq.answer, sortOrder: idx }
                        });
                    } else {
                        await prisma.productFaq.create({
                            data: {
                                productId: item.id,
                                question: faq.question,
                                answer: faq.answer,
                                sortOrder: idx
                            }
                        });
                    }
                }
            }

            // Upsert Product Variants with shopkeeperId in attributes & inventory logs
            for (let vIdx = 0; vIdx < itemData.variants.length; vIdx++) {
                const v = itemData.variants[vIdx];
                const variantAttributes = {
                    ...(v.attributes || {}),
                    shopkeeperId: shopkeeperId
                };

                const variant = await prisma.productVariant.upsert({
                    where: { sku: v.sku },
                    update: {
                        name: v.name,
                        mrp: v.mrp,
                        sellingPrice: v.sellingPrice,
                        costPrice: v.costPrice || null,
                        weight: v.weight || null,
                        volume: v.volume || null,
                        stockQty: v.stockQty || 50,
                        lowStockAlert: v.lowStockAlert || 10,
                        isDefault: v.isDefault || false,
                        isActive: true,
                        sortOrder: vIdx,
                        images: itemData.images,
                        attributes: variantAttributes,
                        productId: item.id
                    },
                    create: {
                        name: v.name,
                        sku: v.sku,
                        mrp: v.mrp,
                        sellingPrice: v.sellingPrice,
                        costPrice: v.costPrice || null,
                        weight: v.weight || null,
                        volume: v.volume || null,
                        stockQty: v.stockQty || 50,
                        lowStockAlert: v.lowStockAlert || 10,
                        isDefault: v.isDefault || false,
                        isActive: true,
                        sortOrder: vIdx,
                        images: itemData.images,
                        attributes: variantAttributes,
                        productId: item.id
                    }
                });

                // Record Inventory Log linking variant directly to shopkeeperId
                const existingLog = await prisma.inventoryLog.findFirst({
                    where: { variantId: variant.id, shopkeeperId }
                });
                if (!existingLog) {
                    await prisma.inventoryLog.create({
                        data: {
                            variantId: variant.id,
                            shopkeeperId: shopkeeperId,
                            type: 'SET',
                            quantityChange: v.stockQty || 50,
                            previousQty: 0,
                            newQty: v.stockQty || 50,
                            note: 'Initial seed stock for Kirana Store'
                        }
                    });
                }

                variantCount++;
            }
        }
        console.log(`  ✓ Seeded Category: "${catData.title}" with ${catData.items.length} products`);
    }

    console.log('\n==========================================');
    console.log('✅ KIRANA STORE SEEDING COMPLETE!');
    console.log(`- Shopkeeper: ${shopkeeper.shopname} (${shopkeeper.id})`);
    console.log(`- Categories Seeded: ${categoryCount} (shopkeeperId: ${shopkeeperId})`);
    console.log(`- Products Seeded:   ${itemCount} (shopkeeperId: ${shopkeeperId})`);
    console.log(`- Variants Seeded:   ${variantCount} (attributes.shopkeeperId & inventoryLogs)`);
    console.log('==========================================\n');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
