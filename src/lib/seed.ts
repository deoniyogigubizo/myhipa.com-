/**
 * Hipa Database Seed Script
 *
 * Populates MongoDB Atlas with:
 * - 10 categories with subcategories
 * - 2 seller accounts (Genius Tech + Fresh Pipe Ltd)
 * - 1 super admin account
 * - ~114 products
 * - Buyers, orders, transactions, reviews
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "./database/mongodb";
import {
  User,
  Seller,
  Product,
  Order,
  Transaction,
  Review,
  AdCampaign,
  AuditLog,
} from "./database/schemas";
import {
  Post,
  Comment,
  Group,
  Question,
  Notification,
} from "./database/schemas/community";

// ============================================
// CATEGORIES (10 total)
// ============================================
const CATEGORIES = [
  {
    id: "electronics_media",
    name: "Electronics & Media",
    subcategories: [
      {
        id: "mobile_accessories",
        name: "Mobile & Accessories",
        examples: ["Smartphones", "Bluetooth Headphones", "Power Banks"],
      },
      {
        id: "computing_laptops",
        name: "Computing & Laptops",
        examples: ["Gaming Laptops", "Tablets", "External Hard Drives"],
      },
      {
        id: "entertainment_gaming",
        name: "Entertainment & Gaming",
        examples: ["Video Game Consoles", "Smart TVs", "Streaming Devices"],
      },
    ],
  },
  {
    id: "fashion_apparel",
    name: "Fashion & Apparel",
    subcategories: [
      {
        id: "mens_womens_clothing",
        name: "Men's & Women's Clothing",
        examples: ["Denim Jeans", "Activewear", "Formal Dresses"],
      },
      {
        id: "footwear",
        name: "Footwear",
        examples: ["Running Shoes", "Leather Boots", "Sandals"],
      },
      {
        id: "accessories",
        name: "Accessories",
        examples: ["Leather Wallets", "Sunglasses", "Wristwatches"],
      },
    ],
  },
  {
    id: "home_garden_tools",
    name: "Home, Garden & Tools",
    subcategories: [
      {
        id: "furniture_decor",
        name: "Furniture & Decor",
        examples: ["Sectional Sofas", "Wall Art", "Area Rugs"],
      },
      {
        id: "kitchen_dining",
        name: "Kitchen & Dining",
        examples: ["Air Fryers", "Knife Sets", "Espresso Machines"],
      },
      {
        id: "outdoor_gardening",
        name: "Outdoor & Gardening",
        examples: ["Lawn Mowers", "Patio Sets", "Gardening Tools"],
      },
    ],
  },
  {
    id: "health_beauty",
    name: "Health, Beauty & Personal Care",
    subcategories: [
      {
        id: "skincare_cosmetics",
        name: "Skincare & Cosmetics",
        examples: ["Moisturizers", "Foundation Makeup", "Sunscreens"],
      },
      {
        id: "haircare_grooming",
        name: "Haircare & Grooming",
        examples: ["Hair Dryers", "Electric Shavers", "Shampoos"],
      },
      {
        id: "health_wellness",
        name: "Health & Wellness",
        examples: ["Multivitamins", "Yoga Mats", "Protein Powders"],
      },
    ],
  },
  {
    id: "sports_outdoors_travel",
    name: "Sports, Outdoors & Travel",
    subcategories: [
      {
        id: "fitness_gym",
        name: "Fitness & Gym",
        examples: ["Dumbbells", "Treadmills", "Resistance Bands"],
      },
      {
        id: "camping_hiking",
        name: "Camping & Hiking",
        examples: ["Tents", "Sleeping Bags", "Hiking Boots"],
      },
      {
        id: "luggage_travel",
        name: "Luggage & Travel Gear",
        examples: ["Carry-on Suitcases", "Backpacks", "Travel Pillows"],
      },
    ],
  },
  {
    id: "baby_kids",
    name: "Baby & Kids",
    subcategories: [
      {
        id: "toys_games",
        name: "Toys & Games",
        examples: ["LEGO Sets", "Board Games", "Dolls"],
      },
      {
        id: "baby_essentials",
        name: "Baby Essentials",
        examples: ["Diapers", "Baby Strollers", "Car Seats"],
      },
    ],
  },
  {
    id: "automotive_industrial",
    name: "Automotive & Industrial",
    subcategories: [
      {
        id: "car_parts_accessories",
        name: "Car Parts & Accessories",
        examples: ["Tires", "Dash Cams", "Engine Oil"],
      },
      {
        id: "tools_equipment",
        name: "Tools & Equipment",
        examples: ["Power Drills", "Workbenches", "Safety Gear"],
      },
    ],
  },
  {
    id: "pet_supplies",
    name: "Pet Supplies",
    subcategories: [
      {
        id: "pet_food_treats",
        name: "Pet Food & Treats",
        examples: ["Dry Dog Food", "Catnip", "Bird Seed"],
      },
      {
        id: "pet_care_toys",
        name: "Pet Care & Toys",
        examples: ["Dog Leashes", "Litter Boxes", "Fish Tanks"],
      },
    ],
  },
  {
    id: "groceries_essentials",
    name: "Groceries & Essentials",
    subcategories: [
      {
        id: "fresh_frozen_food",
        name: "Fresh & Frozen Food",
        examples: ["Organic Produce", "Frozen Pizzas", "Plant-based Milk"],
      },
      {
        id: "household_supplies",
        name: "Household Supplies",
        examples: ["Laundry Detergent", "Toilet Paper", "Cleaning Sprays"],
      },
    ],
  },
  {
    id: "digital_products",
    name: "Digital Products",
    subcategories: [
      {
        id: "software_apps",
        name: "Software & Apps",
        examples: ["Productivity Tools", "Mobile Games", "VPN Services"],
      },
      {
        id: "elearning_media",
        name: "E-Learning & Media",
        examples: ["Online Courses", "E-books", "Music Subscriptions"],
      },
    ],
  },
];

// ============================================
// PRODUCT DATA BY CATEGORY
// ============================================

// GENIUS TECH - Durable/Non-perishable (categories 1-8)
const geniusTechProducts: {
  title: string;
  category: string;
  subcategory: string;
  price: number;
  description: string;
  image: string;
}[] = [
  // 1. Electronics & Media (~20 products)
  // Mobile & Accessories
  {
    title: "Samsung Galaxy S24 Ultra",
    category: "Electronics & Media",
    subcategory: "Mobile & Accessories",
    price: 850000,
    description: '6.8" Dynamic AMOLED, 12GB RAM, 256GB storage, S Pen included',
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400",
  },
  {
    title: "iPhone 15 Pro Max",
    category: "Electronics & Media",
    subcategory: "Mobile & Accessories",
    price: 1200000,
    description: '6.7" Super Retina XDR, A17 Pro chip, 256GB, Titanium design',
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400",
  },
  {
    title: "Tecno Phantom X2 Pro",
    category: "Electronics & Media",
    subcategory: "Mobile & Accessories",
    price: 450000,
    description: '6.8" AMOLED, 12GB RAM, 256GB, retractable portrait lens',
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
  },
  {
    title: "Sony WH-1000XM5 Headphones",
    category: "Electronics & Media",
    subcategory: "Mobile & Accessories",
    price: 185000,
    description: "Industry-leading noise cancellation, 30hr battery",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
  },
  {
    title: "Anker PowerCore 26800mAh",
    category: "Electronics & Media",
    subcategory: "Mobile & Accessories",
    price: 35000,
    description: "High capacity portable charger with dual USB ports",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400",
  },
  {
    title: "Apple AirPods Pro 2",
    category: "Electronics & Media",
    subcategory: "Mobile & Accessories",
    price: 165000,
    description: "Active noise cancellation, spatial audio, MagSafe case",
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400",
  },
  {
    title: "Samsung Galaxy Watch 6",
    category: "Electronics & Media",
    subcategory: "Mobile & Accessories",
    price: 180000,
    description: "Advanced health monitoring, GPS, 40mm aluminum case",
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400",
  },

  // Computing & Laptops
  {
    title: "HP Pavilion Gaming Laptop",
    category: "Electronics & Media",
    subcategory: "Computing & Laptops",
    price: 650000,
    description: "Intel Core i5, 8GB RAM, 512GB SSD, GTX 1650",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
  },
  {
    title: "Lenovo ThinkPad E14",
    category: "Electronics & Media",
    subcategory: "Computing & Laptops",
    price: 580000,
    description: 'Intel Core i7, 16GB RAM, 512GB SSD, 14" FHD',
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400",
  },
  {
    title: "iPad Air 5th Gen",
    category: "Electronics & Media",
    subcategory: "Computing & Laptops",
    price: 550000,
    description: '10.9" Liquid Retina, M1 chip, 64GB WiFi',
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
  },
  {
    title: "Samsung Galaxy Tab S9",
    category: "Electronics & Media",
    subcategory: "Computing & Laptops",
    price: 480000,
    description: '11" Dynamic AMOLED 2X, Snapdragon 8 Gen 2, 128GB',
    image: "https://images.unsplash.com/photo-1561154464-82e9aab73b87?w=400",
  },
  {
    title: "WD My Passport 2TB External HDD",
    category: "Electronics & Media",
    subcategory: "Computing & Laptops",
    price: 55000,
    description: "Portable external hard drive, USB 3.0, password protection",
    image: "https://images.unsplash.com/photo-1597138804456-e7dca7f59d54?w=400",
  },
  {
    title: "Logitech MX Master 3S Mouse",
    category: "Electronics & Media",
    subcategory: "Computing & Laptops",
    price: 65000,
    description: "Wireless ergonomic mouse, 8K DPI, USB-C charging",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
  },

  // Entertainment & Gaming
  {
    title: "PlayStation 5 Console",
    category: "Electronics & Media",
    subcategory: "Entertainment & Gaming",
    price: 750000,
    description: "Next-gen gaming console, 825GB SSD, 4K gaming",
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400",
  },
  {
    title: "Xbox Series X",
    category: "Electronics & Media",
    subcategory: "Entertainment & Gaming",
    price: 720000,
    description: "12 teraflops, 1TB SSD, 4K at 120fps",
    image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400",
  },
  {
    title: 'Samsung 55" 4K Smart TV',
    category: "Electronics & Media",
    subcategory: "Entertainment & Gaming",
    price: 450000,
    description: '55" Crystal UHD 4K, HDR, Tizen OS',
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400",
  },
  {
    title: "Amazon Fire TV Stick 4K",
    category: "Electronics & Media",
    subcategory: "Entertainment & Gaming",
    price: 35000,
    description: "4K streaming device with Alexa voice remote",
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400",
  },
  {
    title: "Nintendo Switch OLED",
    category: "Electronics & Media",
    subcategory: "Entertainment & Gaming",
    price: 380000,
    description: '7" OLED screen, 64GB, enhanced audio',
    image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400",
  },
  {
    title: "JBL Charge 5 Bluetooth Speaker",
    category: "Electronics & Media",
    subcategory: "Entertainment & Gaming",
    price: 85000,
    description: "Portable waterproof speaker, 20hr playtime",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
  },

  // 2. Fashion & Apparel (~16 products)
  // Men's & Women's Clothing
  {
    title: "Levi's 501 Original Jeans",
    category: "Fashion & Apparel",
    subcategory: "Men's & Women's Clothing",
    price: 35000,
    description: "Classic straight fit denim jeans, 100% cotton",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
  },
  {
    title: "Nike Dri-FIT Training Shirt",
    category: "Fashion & Apparel",
    subcategory: "Men's & Women's Clothing",
    price: 18000,
    description: "Moisture-wicking athletic shirt for workouts",
    image: "https://images.unsplash.com/photo-1506629905607-1b06e052cc18?w=400",
  },
  {
    title: "Women's Floral Maxi Dress",
    category: "Fashion & Apparel",
    subcategory: "Men's & Women's Clothing",
    price: 28000,
    description: "Elegant floral print maxi dress, breathable fabric",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
  },
  {
    title: "Men's Formal Suit Set",
    category: "Fashion & Apparel",
    subcategory: "Men's & Women's Clothing",
    price: 85000,
    description: "Two-piece slim fit suit, polyester blend",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400",
  },
  {
    title: "Women's Silk Blouse",
    category: "Fashion & Apparel",
    subcategory: "Men's & Women's Clothing",
    price: 22000,
    description: "Elegant silk blouse, suitable for office and casual wear",
    image: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400",
  },

  // Footwear
  {
    title: "Nike Air Max 270",
    category: "Fashion & Apparel",
    subcategory: "Footwear",
    price: 65000,
    description: "Comfortable lifestyle sneakers with Max Air unit",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
  },
  {
    title: "Timberland Premium 6-Inch Boots",
    category: "Fashion & Apparel",
    subcategory: "Footwear",
    price: 95000,
    description: "Waterproof leather boots, durable rubber lug sole",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
  },
  {
    title: "Adidas Adilette Comfort Slides",
    category: "Fashion & Apparel",
    subcategory: "Footwear",
    price: 15000,
    description: "Comfortable cloudfoam slides for everyday wear",
    image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400",
  },
  {
    title: "Clarks Desert Boots",
    category: "Fashion & Apparel",
    subcategory: "Footwear",
    price: 72000,
    description: "Classic suede desert boots, crepe sole",
    image: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400",
  },

  // Accessories
  {
    title: "Fossil Leather Bifold Wallet",
    category: "Fashion & Apparel",
    subcategory: "Accessories",
    price: 25000,
    description: "Genuine leather wallet with RFID blocking",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400",
  },
  {
    title: "Ray-Ban Aviator Sunglasses",
    category: "Fashion & Apparel",
    subcategory: "Accessories",
    price: 85000,
    description: "Classic gold frame aviator with polarized lenses",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
  },
  {
    title: "Casio G-Shock Digital Watch",
    category: "Fashion & Apparel",
    subcategory: "Accessories",
    price: 55000,
    description: "Shock resistant, 200m water resistant, LED light",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
  },
  {
    title: "Herschel Leather Belt",
    category: "Fashion & Apparel",
    subcategory: "Accessories",
    price: 18000,
    description: "Classic leather belt, brushed silver buckle",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
  },

  // 3. Home, Garden & Tools (~16 products)
  // Furniture & Decor
  {
    title: "L-Shaped Sectional Sofa",
    category: "Home, Garden & Tools",
    subcategory: "Furniture & Decor",
    price: 350000,
    description: "Modern L-shaped sofa with chaise lounge, premium fabric",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
  },
  {
    title: "Abstract Canvas Wall Art Set",
    category: "Home, Garden & Tools",
    subcategory: "Furniture & Decor",
    price: 45000,
    description: "Set of 3 modern abstract canvas prints, gallery wrapped",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
  },
  {
    title: "Persian Area Rug 8x10",
    category: "Home, Garden & Tools",
    subcategory: "Furniture & Decor",
    price: 120000,
    description: "Hand-woven Persian style area rug, durable polypropylene",
    image: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400",
  },
  {
    title: "King Size Platform Bed Frame",
    category: "Home, Garden & Tools",
    subcategory: "Furniture & Decor",
    price: 185000,
    description: "Modern platform bed with upholstered headboard",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400",
  },

  // Kitchen & Dining
  {
    title: "Ninja Air Fryer Max XL",
    category: "Home, Garden & Tools",
    subcategory: "Kitchen & Dining",
    price: 85000,
    description: "5.5 quart air fryer, 7 cooking programs",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
  },
  {
    title: "Wusthof Classic 8-Piece Knife Set",
    category: "Home, Garden & Tools",
    subcategory: "Kitchen & Dining",
    price: 125000,
    description: "German steel chef knife set with wooden block",
    image: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400",
  },
  {
    title: "Breville Barista Express Espresso",
    category: "Home, Garden & Tools",
    subcategory: "Kitchen & Dining",
    price: 350000,
    description: "Semi-automatic espresso machine with built-in grinder",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
  },
  {
    title: "Instant Pot Duo 7-in-1",
    category: "Home, Garden & Tools",
    subcategory: "Kitchen & Dining",
    price: 75000,
    description: "6 quart multi-use pressure cooker, slow cooker, steamer",
    image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400",
  },
  {
    title: "KitchenAid Stand Mixer",
    category: "Home, Garden & Tools",
    subcategory: "Kitchen & Dining",
    price: 280000,
    description: "5-quart tilt-head stand mixer, 10 speeds",
    image: "https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=400",
  },

  // Outdoor & Gardening
  {
    title: "Honda HRN216VKA Lawn Mower",
    category: "Home, Garden & Tools",
    subcategory: "Outdoor & Gardening",
    price: 280000,
    description: '21" self-propelled gas lawn mower, variable speed',
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
  },
  {
    title: "4-Piece Wicker Patio Set",
    category: "Home, Garden & Tools",
    subcategory: "Outdoor & Gardening",
    price: 220000,
    description: "Outdoor wicker sofa set with cushions",
    image: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400",
  },
  {
    title: "Gardening Tool Set 12-Piece",
    category: "Home, Garden & Tools",
    subcategory: "Outdoor & Gardening",
    price: 25000,
    description: "Complete garden hand tool set with carrying bag",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
  },
  {
    title: "Weber Spirit II Gas Grill",
    category: "Home, Garden & Tools",
    subcategory: "Outdoor & Gardening",
    price: 350000,
    description: "3-burner propane gas grill, 450 sq in cooking area",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
  },

  // 4. Health, Beauty & Personal Care (~12 products)
  // Skincare & Cosmetics
  {
    title: "CeraVe Moisturizing Cream 16oz",
    category: "Health, Beauty & Personal Care",
    subcategory: "Skincare & Cosmetics",
    price: 18000,
    description: "Daily face and body moisturizer with ceramides",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400",
  },
  {
    title: "Maybelline Fit Me Foundation",
    category: "Health, Beauty & Personal Care",
    subcategory: "Skincare & Cosmetics",
    price: 8500,
    description: "Matte + poreless liquid foundation, natural coverage",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
  },
  {
    title: "Neutrogena SPF 50 Sunscreen",
    category: "Health, Beauty & Personal Care",
    subcategory: "Skincare & Cosmetics",
    price: 12000,
    description: "Ultra sheer dry-touch sunscreen, broad spectrum SPF 50",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
  },
  {
    title: "The Ordinary Niacinamide Serum",
    category: "Health, Beauty & Personal Care",
    subcategory: "Skincare & Cosmetics",
    price: 9500,
    description: "10% Niacinamide + 1% Zinc serum for blemish-prone skin",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400",
  },

  // Haircare & Grooming
  {
    title: "Dyson Supersonic Hair Dryer",
    category: "Health, Beauty & Personal Care",
    subcategory: "Haircare & Grooming",
    price: 280000,
    description: "Fast drying with intelligent heat control",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
  },
  {
    title: "Braun Series 9 Electric Shaver",
    category: "Health, Beauty & Personal Care",
    subcategory: "Haircare & Grooming",
    price: 185000,
    description: "Wet & dry electric shaver, titanium coating",
    image: "https://images.unsplash.com/photo-1504707748692-419802cf939d?w=400",
  },
  {
    title: "Head & Shoulders Shampoo 750ml",
    category: "Health, Beauty & Personal Care",
    subcategory: "Haircare & Grooming",
    price: 8500,
    description: "Anti-dandruff shampoo with zinc pyrithione",
    image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400",
  },
  {
    title: "Philips Norelco Multigroom 7000",
    category: "Health, Beauty & Personal Care",
    subcategory: "Haircare & Grooming",
    price: 45000,
    description: "All-in-one trimmer, 23 pieces, titanium blades",
    image: "https://images.unsplash.com/photo-1504707748692-419802cf939d?w=400",
  },

  // Health & Wellness
  {
    title: "Centrum Silver Multivitamin",
    category: "Health, Beauty & Personal Care",
    subcategory: "Health & Wellness",
    price: 25000,
    description: "Complete multivitamin for adults 50+, 365 tablets",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
  },
  {
    title: "Manduka PRO Yoga Mat 6mm",
    category: "Health, Beauty & Personal Care",
    subcategory: "Health & Wellness",
    price: 65000,
    description: "Professional quality yoga mat, non-slip surface",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
  },
  {
    title: "Optimum Nutrition Whey Protein",
    category: "Health, Beauty & Personal Care",
    subcategory: "Health & Wellness",
    price: 45000,
    description: "Gold Standard 100% Whey, 5lb chocolate",
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400",
  },
  {
    title: "Omron Blood Pressure Monitor",
    category: "Health, Beauty & Personal Care",
    subcategory: "Health & Wellness",
    price: 55000,
    description: "Upper arm digital BP monitor with memory",
    image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400",
  },

  // 5. Sports, Outdoors & Travel (~14 products)
  // Fitness & Gym
  {
    title: "Bowflex SelectTech 552 Dumbbells",
    category: "Sports, Outdoors & Travel",
    subcategory: "Fitness & Gym",
    price: 350000,
    description: "Adjustable dumbbells, 5-52.5 lbs each",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
  },
  {
    title: "NordicTrack T Series Treadmill",
    category: "Sports, Outdoors & Travel",
    subcategory: "Fitness & Gym",
    price: 550000,
    description: '10" HD touchscreen, incline training, foldable',
    image: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400",
  },
  {
    title: "Resistance Bands Set 12-Piece",
    category: "Sports, Outdoors & Travel",
    subcategory: "Fitness & Gym",
    price: 15000,
    description: "Latex resistance bands with handles and door anchor",
    image: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400",
  },
  {
    title: "Adjustable Weight Bench",
    category: "Sports, Outdoors & Travel",
    subcategory: "Fitness & Gym",
    price: 85000,
    description: "7-position adjustable workout bench, 600lb capacity",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
  },
  {
    title: "TRX Suspension Training Kit",
    category: "Sports, Outdoors & Travel",
    subcategory: "Fitness & Gym",
    price: 120000,
    description: "Complete bodyweight training system",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
  },

  // Camping & Hiking
  {
    title: "Coleman Sundome 4-Person Tent",
    category: "Sports, Outdoors & Travel",
    subcategory: "Camping & Hiking",
    price: 85000,
    description: "4-person dome tent, weatherproof, easy setup",
    image: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=400",
  },
  {
    title: "Kelty Cosmic 20 Sleeping Bag",
    category: "Sports, Outdoors & Travel",
    subcategory: "Camping & Hiking",
    price: 95000,
    description: "Down filled, 20F rated, lightweight backpacking",
    image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=400",
  },
  {
    title: "Merrell Moab 3 Hiking Boots",
    category: "Sports, Outdoors & Travel",
    subcategory: "Camping & Hiking",
    price: 75000,
    description: "Waterproof hiking boots, Vibram sole",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
  },
  {
    title: "Osprey Atmos AG 65 Backpack",
    category: "Sports, Outdoors & Travel",
    subcategory: "Camping & Hiking",
    price: 150000,
    description: "Anti-gravity suspension, 65L capacity",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
  },

  // Luggage & Travel Gear
  {
    title: "Samsonite Omni 2 Carry-On",
    category: "Sports, Outdoors & Travel",
    subcategory: "Luggage & Travel Gear",
    price: 85000,
    description: '20" hardside carry-on spinner, TSA lock',
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400",
  },
  {
    title: "Travel Backpack 40L",
    category: "Sports, Outdoors & Travel",
    subcategory: "Luggage & Travel Gear",
    price: 45000,
    description: "Carry-on travel backpack with laptop compartment",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
  },
  {
    title: "Memory Foam Travel Pillow",
    category: "Sports, Outdoors & Travel",
    subcategory: "Luggage & Travel Gear",
    price: 12000,
    description: "Ergonomic neck support travel pillow with cover",
    image: "https://images.unsplash.com/photo-1584100936595-c0c5b739cd5e?w=400",
  },

  // 6. Baby & Kids (~10 products)
  // Toys & Games
  {
    title: "LEGO Star Wars Millennium Falcon",
    category: "Baby & Kids",
    subcategory: "Toys & Games",
    price: 85000,
    description: "75375 building set, 921 pieces, ages 10+",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=400",
  },
  {
    title: "Monopoly Board Game",
    category: "Baby & Kids",
    subcategory: "Toys & Games",
    price: 18000,
    description: "Classic property trading board game, family edition",
    image: "https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=400",
  },
  {
    title: "Barbie Dreamhouse",
    category: "Baby & Kids",
    subcategory: "Toys & Games",
    price: 120000,
    description: "3-story dollhouse with 75+ accessories",
    image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400",
  },
  {
    title: "Hot Wheels 20-Car Pack",
    category: "Baby & Kids",
    subcategory: "Toys & Games",
    price: 12000,
    description: "Set of 20 1:64 scale die-cast vehicles",
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400",
  },

  // Baby Essentials
  {
    title: "Pampers Diapers Size 3 (168 count)",
    category: "Baby & Kids",
    subcategory: "Baby Essentials",
    price: 35000,
    description: "Baby dry diapers, up to 12 hours of protection",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
  },
  {
    title: "Graco Modes Pramette Stroller",
    category: "Baby & Kids",
    subcategory: "Baby Essentials",
    price: 185000,
    description: "3-in-1 stroller system, reversible seat",
    image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=400",
  },
  {
    title: "Chicco KeyFit 30 Infant Car Seat",
    category: "Baby & Kids",
    subcategory: "Baby Essentials",
    price: 165000,
    description: "Rear-facing infant car seat, 4-30 lbs",
    image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=400",
  },
  {
    title: "Baby Monitor with Camera",
    category: "Baby & Kids",
    subcategory: "Baby Essentials",
    price: 55000,
    description: "1080P HD video baby monitor, night vision, 2-way audio",
    image: "https://images.unsplash.com/photo-1596461011543-88c989248d39?w=400",
  },

  // 7. Automotive & Industrial (~10 products)
  // Car Parts & Accessories
  {
    title: "Michelin Defender T+H Tires (Set of 4)",
    category: "Automotive & Industrial",
    subcategory: "Car Parts & Accessories",
    price: 320000,
    description: "All-season tires, 80,000 mile warranty",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  },
  {
    title: "Garmin Dash Cam 67W",
    category: "Automotive & Industrial",
    subcategory: "Car Parts & Accessories",
    price: 95000,
    description: "1440p HD dash cam, 180-degree field of view",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  },
  {
    title: "Mobil 1 Full Synthetic Motor Oil 5qt",
    category: "Automotive & Industrial",
    subcategory: "Car Parts & Accessories",
    price: 25000,
    description: "Advanced full synthetic, 5W-30, superior protection",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  },
  {
    title: "Car Phone Mount Holder",
    category: "Automotive & Industrial",
    subcategory: "Car Parts & Accessories",
    price: 8000,
    description: "Universal magnetic car phone mount, 360 rotation",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  },

  // Tools & Equipment
  {
    title: "DeWalt 20V MAX Cordless Drill",
    category: "Automotive & Industrial",
    subcategory: "Tools & Equipment",
    price: 95000,
    description: "Brushless cordless drill driver kit, 2 batteries",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
  },
  {
    title: "Heavy Duty Workbench",
    category: "Automotive & Industrial",
    subcategory: "Tools & Equipment",
    price: 150000,
    description: '60" hardwood top workbench, steel frame',
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
  },
  {
    title: "Safety Gear Kit",
    category: "Automotive & Industrial",
    subcategory: "Tools & Equipment",
    price: 25000,
    description: "Complete safety kit: goggles, gloves, ear protection",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
  },
  {
    title: 'Makita Circular Saw 7-1/4"',
    category: "Automotive & Industrial",
    subcategory: "Tools & Equipment",
    price: 120000,
    description: "15A corded circular saw, electric brake",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
  },

  // 8. Pet Supplies (~8 products)
  // Pet Food & Treats
  {
    title: "Blue Buffalo Life Protection Dog Food 30lb",
    category: "Pet Supplies",
    subcategory: "Pet Food & Treats",
    price: 45000,
    description: "Adult dry dog food, chicken and brown rice",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
  },
  {
    title: "Catnip Variety Pack",
    category: "Pet Supplies",
    subcategory: "Pet Food & Treats",
    price: 8000,
    description: "Organic catnip blend, 3-pack refillable toys",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
  },
  {
    title: "Wild Bird Seed Mix 20lb",
    category: "Pet Supplies",
    subcategory: "Pet Food & Treats",
    price: 15000,
    description: "Premium blend for wild birds, no fillers",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
  },
  {
    title: "Purina Pro Plan Cat Food 16lb",
    category: "Pet Supplies",
    subcategory: "Pet Food & Treats",
    price: 35000,
    description: "Complete nutrition adult cat food, salmon & rice",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
  },

  // Pet Care & Toys
  {
    title: "Retractable Dog Leash 16ft",
    category: "Pet Supplies",
    subcategory: "Pet Care & Toys",
    price: 12000,
    description: "Heavy duty retractable leash for dogs up to 110 lbs",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
  },
  {
    title: "Self-Cleaning Litter Box",
    category: "Pet Supplies",
    subcategory: "Pet Care & Toys",
    price: 85000,
    description: "Automatic self-cleaning cat litter box",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
  },
  {
    title: "20-Gallon Fish Tank Kit",
    category: "Pet Supplies",
    subcategory: "Pet Care & Toys",
    price: 95000,
    description: "Complete aquarium kit with filter, heater, LED light",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
  },
  {
    title: "Kong Classic Dog Toy",
    category: "Pet Supplies",
    subcategory: "Pet Care & Toys",
    price: 8000,
    description: "Natural rubber treat dispensing dog toy",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
  },

  // 10. Digital Products (~6 products)
  // Software & Apps
  {
    title: "Microsoft 365 Family 12-Month",
    category: "Digital Products",
    subcategory: "Software & Apps",
    price: 65000,
    description: "Office apps for up to 6 users, 1TB OneDrive each",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
  },
  {
    title: "Adobe Creative Cloud 12-Month",
    category: "Digital Products",
    subcategory: "Software & Apps",
    price: 280000,
    description: "All creative apps including Photoshop, Premiere Pro",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
  },
  {
    title: "Premium VPN 3-Year Subscription",
    category: "Digital Products",
    subcategory: "Software & Apps",
    price: 45000,
    description: "Secure VPN with 5000+ servers worldwide",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400",
  },

  // E-Learning & Media
  {
    title: "Coursera Plus Annual Subscription",
    category: "Digital Products",
    subcategory: "E-Learning & Media",
    price: 250000,
    description: "Unlimited access to 7000+ courses and certificates",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400",
  },
  {
    title: "Kindle Unlimited 12-Month",
    category: "Digital Products",
    subcategory: "E-Learning & Media",
    price: 65000,
    description: "Unlimited access to millions of e-books and audiobooks",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
  },
  {
    title: "Spotify Premium 12-Month",
    category: "Digital Products",
    subcategory: "E-Learning & Media",
    price: 60000,
    description: "Ad-free music streaming, offline listening",
    image: "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=400",
  },
];

// FRESH PIPE LTD - Perishable goods (category 9)
const freshPipeProducts: {
  title: string;
  category: string;
  subcategory: string;
  price: number;
  description: string;
  image: string;
}[] = [
  // Fresh & Frozen Food
  {
    title: "Organic Produce Bundle",
    category: "Groceries & Essentials",
    subcategory: "Fresh & Frozen Food",
    price: 15000,
    description: "Fresh organic vegetables and fruits bundle, locally sourced",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400",
  },
  {
    title: "Frozen Pizza Collection (4-Pack)",
    category: "Groceries & Essentials",
    subcategory: "Fresh & Frozen Food",
    price: 18000,
    description: "Assorted frozen pizzas, ready to bake",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
  },
  {
    title: "Almond Milk 6-Pack",
    category: "Groceries & Essentials",
    subcategory: "Fresh & Frozen Food",
    price: 12000,
    description: "Unsweetened almond milk, 1L each carton",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400",
  },
  {
    title: "Fresh Salmon Fillet 500g",
    category: "Groceries & Essentials",
    subcategory: "Fresh & Frozen Food",
    price: 18000,
    description: "Atlantic salmon fillet, fresh and boneless",
    image: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=400",
  },
  {
    title: "Frozen Mixed Berries 1kg",
    category: "Groceries & Essentials",
    subcategory: "Fresh & Frozen Food",
    price: 8000,
    description: "Frozen blueberries, strawberries, raspberries mix",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400",
  },
  {
    title: "Free-Range Chicken Breast 1kg",
    category: "Groceries & Essentials",
    subcategory: "Fresh & Frozen Food",
    price: 12000,
    description: "Boneless skinless chicken breast, free-range",
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400",
  },
  {
    title: "Fresh Eggs 30-Pack",
    category: "Groceries & Essentials",
    subcategory: "Fresh & Frozen Food",
    price: 8000,
    description: "Farm fresh large eggs, 30 count",
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400",
  },
  {
    title: "Greek Yogurt 1kg",
    category: "Groceries & Essentials",
    subcategory: "Fresh & Frozen Food",
    price: 6000,
    description: "Plain Greek yogurt, high protein, no added sugar",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400",
  },
  {
    title: "Avocados (6-pack)",
    category: "Groceries & Essentials",
    subcategory: "Fresh & Frozen Food",
    price: 6000,
    description: "Ripe Hass avocados, ready to eat",
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400",
  },
  {
    title: "Fresh Strawberries 500g",
    category: "Groceries & Essentials",
    subcategory: "Fresh & Frozen Food",
    price: 5000,
    description: "Sweet fresh strawberries, locally grown",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400",
  },
  {
    title: "Frozen Shrimp 500g",
    category: "Groceries & Essentials",
    subcategory: "Fresh & Frozen Food",
    price: 15000,
    description: "Peeled deveined shrimp, frozen at sea",
    image: "https://images.unsplash.com/photo-1565680018093-ebb6b9eb5300?w=400",
  },

  // Household Supplies
  {
    title: "Tide Laundry Detergent 150oz",
    category: "Groceries & Essentials",
    subcategory: "Household Supplies",
    price: 12000,
    description: "Concentrated liquid laundry detergent, 96 loads",
    image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400",
  },
  {
    title: "Charmin Toilet Paper 24-Roll",
    category: "Groceries & Essentials",
    subcategory: "Household Supplies",
    price: 15000,
    description: "Ultra-soft toilet paper, 24 mega rolls",
    image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400",
  },
  {
    title: "Lysol All-Purpose Cleaner 3-Pack",
    category: "Groceries & Essentials",
    subcategory: "Household Supplies",
    price: 8000,
    description: "Disinfecting spray, kills 99.9% of bacteria",
    image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400",
  },
  {
    title: "Bounty Paper Towels 12-Roll",
    category: "Groceries & Essentials",
    subcategory: "Household Supplies",
    price: 12000,
    description: "Quick-absorbing paper towels, 12 family rolls",
    image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400",
  },
  {
    title: "Cascade Dishwasher Pods 60-Count",
    category: "Groceries & Essentials",
    subcategory: "Household Supplies",
    price: 10000,
    description: "ActionPacs dishwasher detergent pods",
    image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400",
  },
  {
    title: "Swiffer WetJet Starter Kit",
    category: "Groceries & Essentials",
    subcategory: "Household Supplies",
    price: 18000,
    description: "Spray mop with cleaning solution and pads",
    image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400",
  },
  {
    title: "Febreze Air Freshener 3-Pack",
    category: "Groceries & Essentials",
    subcategory: "Household Supplies",
    price: 6000,
    description: "Linen & Sky fabric refresher spray",
    image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400",
  },
  {
    title: "Glad Trash Bags 13-Gallon 80-Count",
    category: "Groceries & Essentials",
    subcategory: "Household Supplies",
    price: 8000,
    description: "ForceFlex kitchen trash bags with drawstring",
    image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400",
  },
  {
    title: "Clorox Disinfecting Wipes 225-Count",
    category: "Groceries & Essentials",
    subcategory: "Household Supplies",
    price: 10000,
    description: "Multi-surface cleaning wipes, bleach-free",
    image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400",
  },
  {
    title: "Downy Fabric Softener 150oz",
    category: "Groceries & Essentials",
    subcategory: "Household Supplies",
    price: 9000,
    description: "April Fresh liquid fabric softener",
    image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400",
  },
  {
    title: "Dawn Dish Soap 3-Pack",
    category: "Groceries & Essentials",
    subcategory: "Household Supplies",
    price: 7000,
    description: "Original dishwashing liquid, 19.4oz each",
    image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400",
  },
];

// ============================================
// SELLER DATA
// ============================================
const sellers = [
  {
    name: "Genius Tech",
    email: "deodeveloper410@gmail.com",
    phone: "+250794990264",
    storeName: "Genius Tech Store",
    storeSlug: "genius-tech-store",
    bio: "Your one-stop shop for durable electronics, fashion, home goods, sports equipment, and more. Quality products that last.",
    location: "Kigali",
    cityCoords: [30.0619, -1.9441] as [number, number],
    categories: [
      "electronics_media",
      "fashion_apparel",
      "home_garden_tools",
      "health_beauty",
      "sports_outdoors_travel",
      "baby_kids",
      "automotive_industrial",
      "pet_supplies",
      "digital_products",
    ],
  },
  {
    name: "Fresh Pipe Ltd",
    email: "deoniyogisubizo@gmail.com",
    phone: "+250792758841",
    storeName: "Fresh Pipe Ltd",
    storeSlug: "fresh-pipe-ltd",
    bio: "Fresh groceries and household essentials delivered to your door. Quality perishable goods you can trust.",
    location: "Kigali",
    cityCoords: [30.0619, -1.9441] as [number, number],
    categories: ["groceries_essentials"],
  },
];

// ============================================
// BUYER DATA
// ============================================
const buyers = [
  {
    name: "Alain Munyampir",
    email: "alain.munyampir@email.rw",
    phone: "+250788111001",
    city: "Kigali",
  },
  {
    name: "Chantal Ahishakiye",
    email: "chantal.ahishakiye@email.rw",
    phone: "+250788111002",
    city: "Kigali",
  },
  {
    name: "Robert Gashumba",
    email: "robert.gashumba@email.rw",
    phone: "+250788111003",
    city: "Huye",
  },
  {
    name: "Grace Mukarugema",
    email: "grace.mukarugema@email.rw",
    phone: "+250788111004",
    city: "Kigali",
  },
  {
    name: "Marc Rugambwa",
    email: "marc.rugambwa@email.rw",
    phone: "+250788111005",
    city: "Musanze",
  },
];

// ============================================
// HELPERS
// ============================================
const AFRICAN_AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1552058544-fd0b5ddc7cb7?w=200&h=200&fit=crop&crop=face",
];

const STORE_BANNERS = [
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1200&h=400&fit=crop",
];

const STORE_LOGOS = [
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1556325716-b8a543a8377a?w=200&h=200&fit=crop",
];

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `ORD-${year}-${random}`;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function seedDatabase() {
  try {
    console.log("🌱 Starting database seed...");
    console.log("📡 Connecting to MongoDB Atlas...");
    await connectDB();
    console.log("✅ Connected to MongoDB Atlas");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Seller.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Transaction.deleteMany({});
    await Review.deleteMany({});
    await (Post as any).deleteMany({});
    await (Group as any).deleteMany({});
    await (Question as any).deleteMany({});
    await AdCampaign.deleteMany({});
    await AuditLog.deleteMany({});
    console.log("✅ Existing data cleared");

    // ============================================
    // 1. CREATE SUPER ADMIN
    // ============================================
    console.log("\n👤 Creating super admin...");
    const passwordHash = await bcrypt.hash("hipa@123!", 12);
    const superAdmin = await User.create({
      email: "myhipa@gmail.com",
      passwordHash,
      phone: "+250788000001",
      role: "admin",
      profile: {
        displayName: "Hirwa Patric",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
        bio: "Super Administrator of Hipa Marketplace",
        location: { city: "Musanze", country: "RW" },
        language: "en",
      },
      reputation: {
        score: 1000,
        level: "leader",
        badges: ["verified_admin", "super_admin"],
        disputesFiled: 0,
        disputesLost: 0,
      },
      wallet: { balance: 0, currency: "RWF", pendingRefunds: 0 },
      auth: {
        emailVerified: true,
        twoFactorEnabled: true,
        lastLogin: new Date(),
        loginProvider: "email",
      },
      preferences: {
        notifications: { email: true, push: true, sms: true },
        savedSearches: [],
        wishlist: [],
        followedSellers: [],
      },
      kycStatus: "verified",
    });
    console.log("  ✅ Created super admin: Hirwa Patric (myhipa@gmail.com)");

    // ============================================
    // 2. CREATE SELLER USERS
    // ============================================
    console.log("\n👤 Creating seller users...");
    const sellerUserIds: mongoose.Types.ObjectId[] = [];

    for (const seller of sellers) {
      const user = await User.create({
        email: seller.email,
        passwordHash: "$2a$10$mockhashedpasswordfortesting123456",
        phone: seller.phone,
        role: "seller",
        profile: {
          displayName: seller.name,
          avatar:
            AFRICAN_AVATARS[sellerUserIds.length % AFRICAN_AVATARS.length],
          bio: seller.bio,
          location: { city: seller.location, country: "RW" },
          language: "en",
        },
        reputation: {
          score: Math.floor(Math.random() * 300) + 200,
          level: "trusted",
          badges: ["verified_seller"],
          disputesFiled: 0,
          disputesLost: 0,
        },
        wallet: { balance: 0, currency: "RWF", pendingRefunds: 0 },
        auth: {
          emailVerified: true,
          twoFactorEnabled: false,
          lastLogin: new Date(),
          loginProvider: "email",
        },
        preferences: {
          notifications: { email: true, push: true, sms: false },
          savedSearches: [],
          wishlist: [],
          followedSellers: [],
        },
        kycStatus: "verified",
      });
      sellerUserIds.push(user._id as mongoose.Types.ObjectId);
      console.log(`  ✅ Created seller user: ${seller.name}`);
    }

    // ============================================
    // 3. CREATE BUYER USERS
    // ============================================
    console.log("\n👤 Creating buyer users...");
    const buyerUserIds: mongoose.Types.ObjectId[] = [];

    for (const buyer of buyers) {
      const user = await User.create({
        email: buyer.email,
        passwordHash: "$2a$10$mockhashedpasswordfortesting123456",
        phone: buyer.phone,
        role: "buyer",
        profile: {
          displayName: buyer.name,
          avatar:
            AFRICAN_AVATARS[(buyerUserIds.length + 3) % AFRICAN_AVATARS.length],
          bio: "Regular shopper on Hipa Marketplace",
          location: { city: buyer.city, country: "RW" },
          language: "en",
        },
        reputation: {
          score: Math.floor(Math.random() * 200) + 50,
          level: "active",
          badges: [],
          disputesFiled: 0,
          disputesLost: 0,
        },
        wallet: {
          balance: Math.floor(Math.random() * 500000) + 50000,
          currency: "RWF",
          pendingRefunds: 0,
        },
        auth: {
          emailVerified: true,
          twoFactorEnabled: false,
          lastLogin: randomDate(new Date(2025, 0, 1), new Date()),
          loginProvider: "email",
        },
        preferences: {
          notifications: { email: true, push: true, sms: false },
          savedSearches: [],
          wishlist: [],
          followedSellers: [],
        },
        kycStatus: "none",
      });
      buyerUserIds.push(user._id as mongoose.Types.ObjectId);
      console.log(`  ✅ Created buyer: ${buyer.name}`);
    }

    // ============================================
    // 4. CREATE SELLER PROFILES
    // ============================================
    console.log("\n🏪 Creating seller profiles...");
    const sellerIds: mongoose.Types.ObjectId[] = [];

    for (let i = 0; i < sellers.length; i++) {
      const sellerData = sellers[i];
      const userId = sellerUserIds[i];

      const seller = await Seller.create({
        userId,
        store: {
          name: sellerData.storeName,
          slug: sellerData.storeSlug,
          logo: STORE_LOGOS[i % STORE_LOGOS.length],
          banner: STORE_BANNERS[i % STORE_BANNERS.length],
          bio: sellerData.bio,
          categories: sellerData.categories,
          location: {
            city: sellerData.location,
            country: "RW",
            coords: { type: "Point", coordinates: sellerData.cityCoords },
          },
        },
        tier: i === 0 ? "gold" : "silver",
        feeRate: 0.03,
        kycStatus: "verified",
        verifiedAt: new Date(),
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          disputeRate: 0,
          avgRating: 4.2 + Math.random() * 0.8,
          reviewCount: 0,
          avgResponseTimeMin: Math.floor(Math.random() * 30) + 10,
          followerCount: Math.floor(Math.random() * 100) + 20,
          productCount: 0,
        },
        wallet: {
          available: 0,
          pending: 0,
          held: 0,
          currency: "RWF",
          totalWithdrawn: 0,
        },
        payoutMethods: [
          {
            type: "mobile_money" as const,
            provider: "MTN",
            number: sellerData.phone,
            isPrimary: true,
          },
        ],
        policies: {
          shipping:
            "We ship within 2-3 business days. Free shipping on orders over 50,000 RWF.",
          returns:
            "We accept returns within 7 days of delivery for unused items in original packaging.",
        },
        shippingZones: [
          { zone: "Kigali", price: 2000, estimatedDays: 1 },
          { zone: "Nationwide", price: 5000, estimatedDays: 3 },
        ],
        businessHours: {
          monday: "08:00-18:00",
          tuesday: "08:00-18:00",
          wednesday: "08:00-18:00",
          thursday: "08:00-18:00",
          friday: "08:00-18:00",
          saturday: "09:00-17:00",
          sunday: null,
        },
        onboardingStep: "completed",
      });

      sellerIds.push(seller._id as mongoose.Types.ObjectId);
      console.log(`  ✅ Created seller: ${sellerData.storeName}`);
    }

    // ============================================
    // 5. CREATE PRODUCTS (~114 total)
    // ============================================
    console.log("\n📦 Creating products...");
    const allProducts: {
      product: mongoose.Types.ObjectId;
      sellerId: mongoose.Types.ObjectId;
      category: string;
      subcategory: string;
      title: string;
      price: number;
      image: string;
    }[] = [];

    // Genius Tech products (durable - 92 products)
    const geniusSellerId = sellerIds[0];
    for (let p = 0; p < geniusTechProducts.length; p++) {
      const prod = geniusTechProducts[p];
      const product = await Product.create({
        sellerId: geniusSellerId,
        title: prod.title,
        slug: `${prod.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${p}`,
        description: prod.description,
        category: {
          primary: prod.category,
          secondary: prod.subcategory,
          path: [prod.category, prod.subcategory],
        },
        media: [{ url: prod.image, type: "image", isPrimary: true, order: 0 }],
        pricing: {
          base: prod.price,
          compareAt: Math.round(prod.price * 1.2),
          currency: "RWF",
          bulkPricing: [],
        },
        variants: [],
        inventory: {
          totalStock: Math.floor(Math.random() * 100) + 10,
          lowStockThreshold: 5,
          trackInventory: true,
          allowBackorder: false,
        },
        shipping: {
          weight: Math.floor(Math.random() * 5) + 0.5,
          dimensions: {
            l: Math.floor(Math.random() * 30) + 10,
            w: Math.floor(Math.random() * 30) + 10,
            h: Math.floor(Math.random() * 20) + 5,
          },
          requiresShipping: prod.category !== "Digital Products",
          digitalDownload: prod.category === "Digital Products",
        },
        seo: { metaTitle: prod.title, metaDescription: prod.description },
        stats: {
          views: Math.floor(Math.random() * 2000),
          addedToCart: Math.floor(Math.random() * 200),
          purchased: Math.floor(Math.random() * 100),
          conversionRate: Math.random() * 0.15,
          avgRating: Math.round((4 + Math.random()) * 10) / 10,
          reviewCount: Math.floor(Math.random() * 50),
          wishlistCount: Math.floor(Math.random() * 50),
        },
        tags: [
          prod.category.toLowerCase(),
          prod.subcategory.toLowerCase(),
          "quality",
          "genius tech",
        ],
        condition: "new",
        status: "active",
      });

      allProducts.push({
        product: product._id as mongoose.Types.ObjectId,
        sellerId: geniusSellerId,
        category: prod.category,
        subcategory: prod.subcategory,
        title: prod.title,
        price: prod.price,
        image: prod.image,
      });
      console.log(`  ✅ Created: ${prod.title} (${prod.category})`);
    }

    // Fresh Pipe Ltd products (perishable - 22 products)
    const freshSellerId = sellerIds[1];
    for (let p = 0; p < freshPipeProducts.length; p++) {
      const prod = freshPipeProducts[p];
      const product = await Product.create({
        sellerId: freshSellerId,
        title: prod.title,
        slug: `${prod.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${p}`,
        description: prod.description,
        category: {
          primary: prod.category,
          secondary: prod.subcategory,
          path: [prod.category, prod.subcategory],
        },
        media: [{ url: prod.image, type: "image", isPrimary: true, order: 0 }],
        pricing: {
          base: prod.price,
          compareAt: Math.round(prod.price * 1.2),
          currency: "RWF",
          bulkPricing: [],
        },
        variants: [],
        inventory: {
          totalStock: Math.floor(Math.random() * 200) + 50,
          lowStockThreshold: 10,
          trackInventory: true,
          allowBackorder: false,
        },
        shipping: {
          weight: Math.floor(Math.random() * 3) + 0.5,
          dimensions: {
            l: Math.floor(Math.random() * 20) + 10,
            w: Math.floor(Math.random() * 20) + 10,
            h: Math.floor(Math.random() * 15) + 5,
          },
          requiresShipping: true,
          digitalDownload: false,
        },
        seo: { metaTitle: prod.title, metaDescription: prod.description },
        stats: {
          views: Math.floor(Math.random() * 1500),
          addedToCart: Math.floor(Math.random() * 150),
          purchased: Math.floor(Math.random() * 80),
          conversionRate: Math.random() * 0.12,
          avgRating: Math.round((4 + Math.random()) * 10) / 10,
          reviewCount: Math.floor(Math.random() * 40),
          wishlistCount: Math.floor(Math.random() * 30),
        },
        tags: [
          prod.category.toLowerCase(),
          prod.subcategory.toLowerCase(),
          "fresh",
          "fresh pipe ltd",
        ],
        condition: "new",
        status: "active",
      });

      allProducts.push({
        product: product._id as mongoose.Types.ObjectId,
        sellerId: freshSellerId,
        category: prod.category,
        subcategory: prod.subcategory,
        title: prod.title,
        price: prod.price,
        image: prod.image,
      });
      console.log(`  ✅ Created: ${prod.title} (${prod.category})`);
    }

    console.log(`\n📦 Total products created: ${allProducts.length}`);

    // ============================================
    // 6. CREATE ORDERS & TRANSACTIONS
    // ============================================
    console.log("\n🛒 Creating orders and transactions...");
    const orderStatuses: Array<
      | "pending_payment"
      | "payment_held"
      | "seller_processing"
      | "in_delivery"
      | "dispute_window"
      | "completed"
      | "disputed"
      | "cancelled"
      | "refunded"
    > = [
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
      "in_delivery",
      "dispute_window",
      "completed",
      "completed",
      "completed",
    ];

    for (let i = 0; i < 10; i++) {
      const buyerUserId = buyerUserIds[i % buyerUserIds.length];
      const sellerIndex = i < 7 ? 0 : 1; // 7 orders for Genius Tech, 3 for Fresh Pipe
      const sellerId = sellerIds[sellerIndex];

      const sellerProducts = allProducts.filter(
        (p) => p.sellerId.toString() === sellerId.toString(),
      );
      if (sellerProducts.length === 0) continue;

      const numItems = Math.min(3, sellerProducts.length);
      const startIdx = Math.floor(
        Math.random() * Math.max(1, sellerProducts.length - numItems),
      );
      const orderProducts = sellerProducts.slice(startIdx, startIdx + numItems);

      if (orderProducts.length === 0) continue;

      const items = orderProducts.map((p) => ({
        productId: p.product,
        title: p.title,
        image: p.image,
        qty: Math.floor(Math.random() * 2) + 1,
        unitPrice: p.price,
        lineTotal: p.price * (Math.floor(Math.random() * 2) + 1),
      }));

      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const shippingFee = subtotal > 50000 ? 0 : 3000;
      const hipaFee = Math.round(subtotal * 0.03);
      const total = subtotal + shippingFee;
      const sellerPayout = total - hipaFee;

      const status = orderStatuses[i];
      const createdAt = randomDate(
        new Date(2025, 6, 1),
        new Date(2025, 11, 31),
      );
      const paidAt = new Date(createdAt.getTime() + 1000 * 60 * 60);

      const order = await Order.create({
        orderNumber: generateOrderNumber(),
        buyerId: buyerUserId,
        sellerId,
        items,
        pricing: {
          subtotal,
          shippingFee,
          discount: 0,
          total,
          currency: "RWF",
          hipaFee,
          sellerPayout,
        },
        delivery: {
          method: "standard",
          address: {
            fullName: buyers[i % buyers.length].name,
            phone: buyers[i % buyers.length].phone,
            street: `Street ${Math.floor(Math.random() * 100) + 1}`,
            city: buyers[i % buyers.length].city,
            country: "RW",
          },
          estimatedDate: new Date(
            createdAt.getTime() + 7 * 24 * 60 * 60 * 1000,
          ),
          tracking:
            status !== "pending_payment"
              ? {
                  number: `TRK${Date.now()}${i}`,
                  courier: "Rwanda Post",
                  uploadedAt: new Date(
                    createdAt.getTime() + 2 * 24 * 60 * 60 * 1000,
                  ),
                }
              : undefined,
        },
        status,
        statusHistory: [
          { status: "pending_payment", at: createdAt },
          {
            status: "payment_held",
            at: new Date(createdAt.getTime() + 1000 * 60 * 60),
          },
          {
            status: "seller_processing",
            at: new Date(createdAt.getTime() + 1000 * 60 * 60 * 2),
          },
          ...(status === "in_delivery" ||
          status === "completed" ||
          status === "dispute_window"
            ? [
                {
                  status: "in_delivery" as const,
                  at: new Date(createdAt.getTime() + 1000 * 60 * 60 * 24),
                },
              ]
            : []),
          ...(status === "completed" || status === "dispute_window"
            ? [
                {
                  status: "dispute_window" as const,
                  at: new Date(createdAt.getTime() + 1000 * 60 * 60 * 48),
                },
              ]
            : []),
          ...(status === "completed"
            ? [
                {
                  status: "completed" as const,
                  at: new Date(createdAt.getTime() + 1000 * 60 * 60 * 72),
                },
              ]
            : []),
        ],
        sellerShipDeadline: new Date(
          createdAt.getTime() + 3 * 24 * 60 * 60 * 1000,
        ),
        disputeWindowEnd: new Date(
          createdAt.getTime() + 14 * 24 * 60 * 60 * 1000,
        ),
        autoReleaseAt:
          status === "completed"
            ? new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000)
            : undefined,
        payment: {
          method: "mobile_money",
          provider: i % 2 === 0 ? "MTN" : "Airtel",
          gatewayRef: `TXN${Date.now()}${i}`,
          paidAt,
        },
        notes: {
          buyer: "",
          sellerInternal: `Order processed on ${createdAt.toDateString()}`,
        },
        createdAt,
      });

      await Transaction.create({
        orderId: order._id,
        buyerId: buyerUserId,
        sellerId,
        amount: total,
        hipaFee,
        sellerPayout,
        currency: "RWF",
        escrow: {
          status: status === "completed" ? "released" : "held",
          heldAt: paidAt,
          releasedAt: status === "completed" ? new Date() : undefined,
          releaseType: status === "completed" ? "auto_release" : undefined,
        },
        dispute: { raised: status === "dispute_window" },
        chargebackRisk: false,
      });

      await AuditLog.create({
        actor: {
          userId: buyerUserId,
          role: "buyer",
          ip: `41.210.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          userAgent: "Mozilla/5.0",
        },
        action: "order_created",
        entity: { type: "order", id: order._id },
        metadata: { orderNumber: order.orderNumber },
        createdAt,
      });

      console.log(
        `  ✅ Created order: ${order.orderNumber} - Status: ${status}`,
      );
    }

    // ============================================
    // 7. CREATE REVIEWS (many)
    // ============================================
    console.log("\n⭐ Creating reviews...");

    const reviewTitles = [
      "Excellent quality!",
      "Highly recommended",
      "Great value for money",
      "Fast delivery, great product",
      "Exceeded expectations",
      "Perfect!",
      "Very satisfied with purchase",
      "Will buy again",
      "Top-notch quality",
      "Amazing product",
      "Worth every penny",
      "Best purchase this month",
      "Outstanding quality",
      "Love it!",
      "Five stars!",
      "Impressive quality",
      "Better than expected",
      "Superb product",
      "Great deal!",
      "Fantastic purchase",
    ];

    const reviewBodies = [
      "This product exceeded my expectations. The quality is outstanding and delivery was fast.",
      "Very happy with this purchase. Great quality and the seller was very professional.",
      "Exactly as described. High quality materials and excellent craftsmanship.",
      "Fast shipping and the product is exactly what I needed. Highly recommend this seller.",
      "Amazing quality for the price. I will definitely be ordering more from this store.",
      "Product arrived in perfect condition. Very pleased with the quality and service.",
      "Great product! Works exactly as advertised. Very happy with my purchase.",
      "Best quality I have found on this platform. Seller is very reliable.",
      "Excellent product, well packaged, and delivered on time. Highly recommend!",
      "This is my third purchase from this seller. Consistently great quality.",
    ];

    // Create 60 reviews - spread across all products
    for (let i = 0; i < 60; i++) {
      const randomProduct =
        allProducts[Math.floor(Math.random() * allProducts.length)];
      const randomBuyer =
        buyerUserIds[Math.floor(Math.random() * buyerUserIds.length)];
      const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5

      await Review.create({
        productId: randomProduct.product,
        sellerId: randomProduct.sellerId,
        buyerId: randomBuyer,
        orderId: new mongoose.Types.ObjectId(),
        rating,
        title: reviewTitles[Math.floor(Math.random() * reviewTitles.length)],
        body: reviewBodies[Math.floor(Math.random() * reviewBodies.length)],
        media: [],
        verified: true,
        helpful: Math.floor(Math.random() * 20),
        notHelpful: Math.floor(Math.random() * 2),
        status: "published",
        flagCount: 0,
        createdAt: randomDate(new Date(2025, 3, 1), new Date()),
      });
    }
    console.log("  ✅ Created 60 reviews");

    // ============================================
    // 8. CREATE COMMUNITY DATA
    // ============================================
    console.log("\n📱 Creating community content...");

    const postContent = [
      "Check out our latest electronics collection! Amazing deals on smartphones and laptops.",
      "Fresh groceries delivered to your door. Order now for same-day delivery!",
      "New fashion arrivals this week. Premium quality at unbeatable prices.",
      "Home improvement season! Get your tools and garden supplies today.",
      "Health and wellness products now available. Take care of yourself!",
      "Sports equipment sale - up to 30% off on fitness gear.",
      "Baby essentials in stock. Everything your little one needs.",
      "Pet supplies for your furry friends. Quality food and toys.",
      "Automotive parts and tools for DIY enthusiasts.",
      "Digital products and subscriptions now available. Upgrade your tech life!",
      "Flash sale this weekend! Don't miss out on incredible deals.",
      "Customer spotlight: Thank you for your amazing support!",
      "New seller onboarding guide - tips for success on Hipa.",
      "Quality assurance: How we ensure product quality on our platform.",
      "Community update: New features coming to Hipa Marketplace!",
    ];

    for (let i = 0; i < 15; i++) {
      const sellerIdx = i < 10 ? 0 : 1;
      const randomProduct = allProducts.filter(
        (p) => p.sellerId.toString() === sellerIds[sellerIdx].toString(),
      )[Math.floor(Math.random() * 10)];

      await (Post as any).create({
        author: {
          userId: sellerUserIds[sellerIdx],
          name: sellers[sellerIdx].name,
          avatar: AFRICAN_AVATARS[sellerIdx],
          isVerified: true,
          reputationScore: 400,
          level: "trusted",
        },
        type: ["product_share", "community_update", "deal_alert"][i % 3],
        content: {
          text: postContent[i],
          media: undefined,
          productId: randomProduct?.product,
          productSnapshot: randomProduct
            ? {
                title: randomProduct.title,
                price: randomProduct.price,
                image: randomProduct.image,
                slug: randomProduct.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-"),
              }
            : undefined,
        },
        visibility: "public",
        engagement: {
          likes: Math.floor(Math.random() * 100) + 10,
          comments: Math.floor(Math.random() * 30) + 5,
          shares: Math.floor(Math.random() * 20),
          saves: Math.floor(Math.random() * 25),
          views: Math.floor(Math.random() * 1000) + 100,
        },
        likedBy: [],
        savedBy: [],
        mentions: [],
        tags: ["marketplace", "rwanda", "hipa"],
        status: "published",
        flags: [],
        boosted: Math.random() > 0.7,
        aiScore: Math.random(),
        createdAt: randomDate(new Date(2025, 0, 1), new Date()),
      });
    }
    console.log("  ✅ Created 15 community posts");

    // Create groups
    const groups = [
      {
        name: "Rwanda Tech Enthusiasts",
        slug: "rwanda-tech",
        category: "Technology",
        type: "interest",
      },
      {
        name: "Rwanda Fashion Hub",
        slug: "rwanda-fashion",
        category: "Fashion",
        type: "interest",
      },
      {
        name: "Kigali Small Business Owners",
        slug: "kigali-sbos",
        category: "Business",
        type: "location",
      },
      {
        name: "Fresh Food Lovers Rwanda",
        slug: "fresh-food-rw",
        category: "Food",
        type: "category",
      },
    ];

    for (const group of groups) {
      await (Group as any).create({
        name: group.name,
        slug: group.slug,
        description: `A community for ${group.name.toLowerCase()} in Rwanda`,
        type: group.type,
        privacy: "public",
        category: group.category,
        admin: { userId: sellerUserIds[0], name: sellers[0].name },
        memberCount: Math.floor(Math.random() * 200) + 50,
        rules: ["Be respectful", "No spam", "Keep it relevant to Rwanda"],
        isActive: true,
        createdAt: randomDate(new Date(2025, 0, 1), new Date()),
      });
    }
    console.log("  ✅ Created 4 groups");

    // Create questions
    const questions = [
      "Where can I find wholesale electronics in Kigali?",
      "What are the best practices for selling on Hipa?",
      "How do I set up my online store on Hipa Marketplace?",
      "Looking for reliable fresh produce suppliers in Rwanda",
      "Tips for improving product photography for online sales?",
      "How does the escrow payment system work?",
      "Best shipping options for nationwide delivery in Rwanda?",
      "Can I sell digital products on Hipa Marketplace?",
    ];

    for (let i = 0; i < questions.length; i++) {
      const userId = buyerUserIds[i % buyerUserIds.length];
      await (Question as any).create({
        title: questions[i],
        slug: questions[i].toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        author: {
          userId,
          name: buyers[i % buyers.length].name,
          isVerified: false,
        },
        content: {
          text: questions[i] + " Any advice would be greatly appreciated!",
        },
        tags: ["help", "marketplace", "rwanda"],
        category: "General",
        upvoteCount: Math.floor(Math.random() * 30),
        viewCount: Math.floor(Math.random() * 200),
        answerCount: Math.floor(Math.random() * 8),
        status: "published",
        createdAt: randomDate(new Date(2025, 3, 1), new Date()),
      });
    }
    console.log("  ✅ Created 8 questions");

    // ============================================
    // COMPLETE
    // ============================================
    const geniusProductCount = geniusTechProducts.length;
    const freshProductCount = freshPipeProducts.length;

    console.log("\n🎉 Database seed completed successfully!");
    console.log(`
📊 SEED SUMMARY
═══════════════════════════════════════════

👤 Super Admin:
   ✅ Hirwa Patric (myhipa@gmail.com)
      Location: Musanze
      Password: hipa@123!

🏪 Sellers (2):
   ✅ Genius Tech (deodeveloper410@gmail.com)
      Phone: +250794990264
      Products: ${geniusProductCount} (durable/non-perishable)
      Categories: Electronics, Fashion, Home, Health, Sports, Baby, Auto, Pet, Digital
      Balance: 0 RWF
      Rating: 4.0+

   ✅ Fresh Pipe Ltd (deoniyogisubizo@gmail.com)
      Phone: +250792758841
      Products: ${freshProductCount} (perishable goods)
      Categories: Groceries & Essentials
      Balance: 0 RWF
      Rating: 4.0+

📦 Products: ${allProducts.length} total
   - ${geniusProductCount} durable (Genius Tech)
   - ${freshProductCount} perishable (Fresh Pipe Ltd)

📂 10 Categories:
   1. Electronics & Media (mobile, computing, entertainment)
   2. Fashion & Apparel (clothing, footwear, accessories)
   3. Home, Garden & Tools (furniture, kitchen, outdoor)
   4. Health, Beauty & Personal Care (skincare, haircare, wellness)
   5. Sports, Outdoors & Travel (fitness, camping, luggage)
   6. Baby & Kids (toys, baby essentials)
   7. Automotive & Industrial (car parts, tools)
   8. Pet Supplies (food, care & toys)
   9. Groceries & Essentials (fresh food, household)
   10. Digital Products (software, e-learning)

👥 Buyers: 5
🛒 Orders: 10
💰 Transactions: 10
⭐ Reviews: 60
📱 Community Posts: 15
👥 Groups: 4
❓ Questions: 8

Database: hipa (MongoDB Atlas)
═══════════════════════════════════════════
    `);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

// Run the seed
seedDatabase();
