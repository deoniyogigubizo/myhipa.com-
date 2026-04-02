const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa",
    );
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;

    // Hash passwords
    const saltRounds = 12;
    const superAdminPassword = await bcrypt.hash("hipa@123!", saltRounds);
    const userPassword = await bcrypt.hash("maiden@410", saltRounds);

    console.log("Creating users...");

    // Create Super Admin
    const superAdmin = {
      _id: new mongoose.Types.ObjectId(),
      name: "Hirwa Patric",
      email: "hirwapatric@gmail.com",
      passwordHash: superAdminPassword,
      role: "superadmin",
      phone: "+250789123456",
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        bio: "Super Administrator of Hipa Marketplace",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      },
      permissions: ["*"],
      kyc: {
        status: "verified",
        documents: [],
      },
    };

    // Create Buyer
    const buyer = {
      _id: new mongoose.Types.ObjectId(),
      name: "Jazzman",
      email: "jazzman@gmail.com",
      passwordHash: userPassword,
      role: "buyer",
      phone: "+250788123456",
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        bio: "Regular buyer on Hipa Marketplace",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      },
      kyc: {
        status: "verified",
        documents: [],
      },
    };

    // Create Seller 1: Genius Tech (Durable/Non-perishable goods)
    const seller1 = {
      _id: new mongoose.Types.ObjectId(),
      name: "Genius Tech",
      email: "deodeveloper@gmail.com",
      passwordHash: userPassword,
      role: "seller",
      phone: "+250794990264",
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        bio: "All non-perishable goods including tools and furniture",
        avatar:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
      },
      store: {
        name: "Genius Tech Store",
        description:
          "Specializing in durable tools, furniture, electronics, and long-lasting products",
        categories: [
          "Electronics & Media",
          "Home, Garden & Tools",
          "Automotive & Industrial",
          "Fashion & Apparel",
          "Sports, Outdoors & Travel",
          "Pet Supplies",
          "Digital Products",
        ],
        location: {
          city: "Kigali",
          country: "Rwanda",
          coordinates: { lat: -1.9441, lng: 30.0619 },
        },
        stats: {
          totalProducts: 0,
          totalSales: 0,
          totalRevenue: 0,
          averageRating: 0,
        },
      },
      kyc: {
        status: "verified",
        documents: [],
      },
    };

    // Create Seller 2: Fresh Facte Ltd (Perishable goods)
    const seller2 = {
      _id: new mongoose.Types.ObjectId(),
      name: "Fresh Facte Ltd",
      email: "deoniyogisubizo@gmail.com",
      passwordHash: userPassword,
      role: "seller",
      phone: "+250795123456",
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        bio: "Fresh produce and perishable goods supplier",
        avatar:
          "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400",
      },
      store: {
        name: "Fresh Facte Ltd",
        description:
          "Quality fresh produce, groceries, and perishable essentials",
        categories: [
          "Groceries & Essentials",
          "Health, Beauty & Personal Care",
          "Baby & Kids",
        ],
        location: {
          city: "Kigali",
          country: "Rwanda",
          coordinates: { lat: -1.95, lng: 30.0589 }, // Slightly different location
        },
        stats: {
          totalProducts: 0,
          totalSales: 0,
          totalRevenue: 0,
          averageRating: 0,
        },
      },
      kyc: {
        status: "verified",
        documents: [],
      },
    };

    // Insert users
    await db
      .collection("users")
      .insertMany([superAdmin, buyer, seller1, seller2]);
    console.log("✅ Created 4 users (1 superadmin, 1 buyer, 2 sellers)");

    // Create Seller documents for seller users
    console.log("Creating seller profiles...");

    const seller1Profile = {
      _id: new mongoose.Types.ObjectId(),
      userId: seller1._id,
      store: {
        name: seller1.store.name,
        slug: seller1.store.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        bio: seller1.store.description,
        categories: seller1.store.categories,
        location: {
          city: seller1.store.location.city,
          country: seller1.store.location.country,
          coords: {
            type: "Point",
            coordinates: [
              seller1.store.location.coordinates.lng,
              seller1.store.location.coordinates.lat,
            ],
          },
        },
      },
      tier: "standard",
      feeRate: 0.03,
      kycStatus: "verified",
      stats: {
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        disputeRate: 0,
        avgRating: 0,
        reviewCount: 0,
        avgResponseTimeMin: 0,
        followerCount: 0,
        productCount: 0,
      },
      wallet: {
        available: 0,
        pending: 0,
        held: 0,
        currency: "RWF",
        totalWithdrawn: 0,
      },
      payoutMethods: [],
      policies: {
        shipping: "",
        returns: "",
      },
      shippingZones: [],
      businessHours: {},
      onboardingStep: "completed",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const seller2Profile = {
      _id: new mongoose.Types.ObjectId(),
      userId: seller2._id,
      store: {
        name: seller2.store.name,
        slug: seller2.store.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        bio: seller2.store.description,
        categories: seller2.store.categories,
        location: {
          city: seller2.store.location.city,
          country: seller2.store.location.country,
          coords: {
            type: "Point",
            coordinates: [
              seller2.store.location.coordinates.lng,
              seller2.store.location.coordinates.lat,
            ],
          },
        },
      },
      tier: "standard",
      feeRate: 0.03,
      kycStatus: "verified",
      stats: {
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        disputeRate: 0,
        avgRating: 0,
        reviewCount: 0,
        avgResponseTimeMin: 0,
        followerCount: 0,
        productCount: 0,
      },
      wallet: {
        available: 0,
        pending: 0,
        held: 0,
        currency: "RWF",
        totalWithdrawn: 0,
      },
      payoutMethods: [],
      policies: {
        shipping: "",
        returns: "",
      },
      shippingZones: [],
      businessHours: {},
      onboardingStep: "completed",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("sellers").insertMany([seller1Profile, seller2Profile]);
    console.log("✅ Created 2 seller profiles");

    // Create products for each subcategory - comprehensive coverage
    console.log("Creating products...");

    const products = [];

    // 1. Electronics & Media - Genius Tech
    // Mobile & Accessories
    products.push({
      _id: new mongoose.Types.ObjectId(),
      title: "Samsung Galaxy A14 Smartphone",
      slug: "samsung-galaxy-a14-smartphone",
      description: '6.6" display, 4GB RAM, 128GB storage - Durable smartphone',
      sellerId: seller1Profile._id,
      category: {
        primary: "Electronics & Media",
        secondary: "Mobile & Accessories",
        tertiary: "Smartphones",
        path: ["Electronics & Media", "Mobile & Accessories", "Smartphones"],
      },
      pricing: { base: 350000, compareAt: 400000, currency: "RWF" },
      inventory: {
        totalStock: 50,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400",
          alt: "Samsung Galaxy A14 Smartphone",
          type: "image",
        },
      ],
      tags: ["smartphone", "samsung", "galaxy", "durable", "electronics"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Samsung Galaxy A14 Smartphone - Hipa Marketplace",
        metaDescription: "Buy Samsung Galaxy A14 Smartphone at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Wireless Bluetooth Headphones",
      slug: "wireless-bluetooth-headphones",
      description: "Premium wireless headphones with noise cancellation",
      sellerId: seller1Profile._id,
      category: {
        primary: "Electronics & Media",
        secondary: "Mobile & Accessories",
        tertiary: "Bluetooth Headphones",
        path: [
          "Electronics & Media",
          "Mobile & Accessories",
          "Bluetooth Headphones",
        ],
      },
      pricing: { base: 45000, compareAt: 55000, currency: "RWF" },
      inventory: {
        totalStock: 75,
        lowStockThreshold: 8,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
          alt: "Wireless Bluetooth Headphones",
          type: "image",
        },
      ],
      tags: ["headphones", "bluetooth", "wireless", "audio", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Wireless Bluetooth Headphones - Hipa Marketplace",
        metaDescription: "Buy Wireless Bluetooth Headphones at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Computing & Laptops
    products.push({
      title: "Gaming Laptop - HP Pavilion",
      slug: "gaming-laptop-hp-pavilion",
      description:
        "Intel Core i5, 8GB RAM, 256GB SSD - Perfect for gaming and work",
      sellerId: seller1Profile._id,
      category: {
        primary: "Electronics & Media",
        secondary: "Computing & Laptops",
        tertiary: "Gaming Laptops",
        path: ["Electronics & Media", "Computing & Laptops", "Gaming Laptops"],
      },
      pricing: { base: 650000, compareAt: 700000, currency: "RWF" },
      inventory: {
        totalStock: 20,
        lowStockThreshold: 3,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
          alt: "Gaming Laptop HP Pavilion",
          type: "image",
        },
      ],
      tags: ["laptop", "gaming", "hp", "durable", "computer"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Gaming Laptop HP Pavilion - Hipa Marketplace",
        metaDescription: "Buy Gaming Laptop HP Pavilion at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "iPad Tablet - Latest Model",
      slug: "ipad-tablet-latest-model",
      description: "10.9-inch Liquid Retina display, A14 Bionic chip",
      sellerId: seller1Profile._id,
      category: {
        primary: "Electronics & Media",
        secondary: "Computing & Laptops",
        tertiary: "Tablets",
        path: ["Electronics & Media", "Computing & Laptops", "Tablets"],
      },
      pricing: { base: 550000, compareAt: 600000, currency: "RWF" },
      inventory: {
        totalStock: 30,
        lowStockThreshold: 4,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
          alt: "iPad Tablet Latest Model",
          type: "image",
        },
      ],
      tags: ["tablet", "ipad", "apple", "durable", "portable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "iPad Tablet Latest Model - Hipa Marketplace",
        metaDescription: "Buy iPad Tablet Latest Model at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Entertainment & Gaming
    products.push({
      title: "PlayStation 5 Console",
      slug: "playstation-5-console",
      description: "Next-gen gaming console with 825GB SSD",
      sellerId: seller1Profile._id,
      category: {
        primary: "Electronics & Media",
        secondary: "Entertainment & Gaming",
        tertiary: "Video Game Consoles",
        path: [
          "Electronics & Media",
          "Entertainment & Gaming",
          "Video Game Consoles",
        ],
      },
      pricing: { base: 750000, compareAt: 800000, currency: "RWF" },
      inventory: {
        totalStock: 15,
        lowStockThreshold: 2,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400",
          alt: "PlayStation 5 Console",
          type: "image",
        },
      ],
      tags: ["playstation", "ps5", "gaming", "console", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "PlayStation 5 Console - Hipa Marketplace",
        metaDescription: "Buy PlayStation 5 Console at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: '4K Smart TV - Samsung 55"',
      slug: "4k-smart-tv-samsung-55",
      description: "55-inch 4K UHD Smart TV with HDR",
      sellerId: seller1Profile._id,
      category: {
        primary: "Electronics & Media",
        secondary: "Entertainment & Gaming",
        tertiary: "Smart TVs",
        path: ["Electronics & Media", "Entertainment & Gaming", "Smart TVs"],
      },
      pricing: { base: 850000, compareAt: 950000, currency: "RWF" },
      inventory: {
        totalStock: 12,
        lowStockThreshold: 2,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400",
          alt: '4K Smart TV Samsung 55"',
          type: "image",
        },
      ],
      tags: ["tv", "samsung", "4k", "smart", "entertainment"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: '4K Smart TV Samsung 55" - Hipa Marketplace',
        metaDescription: 'Buy 4K Smart TV Samsung 55" at best price',
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Home, Garden & Tools - Genius Tech
    // Furniture & Decor
    products.push({
      title: "Modern Sectional Sofa",
      slug: "modern-sectional-sofa",
      description: "Comfortable 3-seater sectional sofa with premium fabric",
      sellerId: seller1Profile._id,
      category: {
        primary: "Home, Garden & Tools",
        secondary: "Furniture & Decor",
        tertiary: "Sectional Sofas",
        path: ["Home, Garden & Tools", "Furniture & Decor", "Sectional Sofas"],
      },
      pricing: { base: 450000, compareAt: 500000, currency: "RWF" },
      inventory: {
        totalStock: 10,
        lowStockThreshold: 2,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
          alt: "Modern Sectional Sofa",
          type: "image",
        },
      ],
      tags: ["sofa", "furniture", "durable", "home", "living room"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Modern Sectional Sofa - Hipa Marketplace",
        metaDescription: "Buy Modern Sectional Sofa at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Abstract Wall Art Canvas",
      slug: "abstract-wall-art-canvas",
      description: "Modern abstract wall art canvas set of 3",
      sellerId: seller1Profile._id,
      category: {
        primary: "Home, Garden & Tools",
        secondary: "Furniture & Decor",
        tertiary: "Wall Art",
        path: ["Home, Garden & Tools", "Furniture & Decor", "Wall Art"],
      },
      pricing: { base: 25000, compareAt: 30000, currency: "RWF" },
      inventory: {
        totalStock: 40,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
          alt: "Abstract Wall Art Canvas",
          type: "image",
        },
      ],
      tags: ["art", "wall", "decor", "canvas", "home"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Abstract Wall Art Canvas - Hipa Marketplace",
        metaDescription: "Buy Abstract Wall Art Canvas at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Kitchen & Dining
    products.push({
      title: "Professional Air Fryer",
      slug: "professional-air-fryer",
      description: "5.8-quart air fryer with digital controls",
      sellerId: seller1Profile._id,
      category: {
        primary: "Home, Garden & Tools",
        secondary: "Kitchen & Dining",
        tertiary: "Air Fryers",
        path: ["Home, Garden & Tools", "Kitchen & Dining", "Air Fryers"],
      },
      pricing: { base: 65000, compareAt: 75000, currency: "RWF" },
      inventory: {
        totalStock: 25,
        lowStockThreshold: 3,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
          alt: "Professional Air Fryer",
          type: "image",
        },
      ],
      tags: ["air fryer", "kitchen", "cooking", "appliance", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Professional Air Fryer - Hipa Marketplace",
        metaDescription: "Buy Professional Air Fryer at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Professional Knife Set",
      slug: "professional-knife-set",
      description: "8-piece stainless steel chef knife set",
      sellerId: seller1Profile._id,
      category: {
        primary: "Home, Garden & Tools",
        secondary: "Kitchen & Dining",
        tertiary: "Knife Sets",
        path: ["Home, Garden & Tools", "Kitchen & Dining", "Knife Sets"],
      },
      pricing: { base: 35000, compareAt: 40000, currency: "RWF" },
      inventory: {
        totalStock: 35,
        lowStockThreshold: 4,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400",
          alt: "Professional Knife Set",
          type: "image",
        },
      ],
      tags: ["knife", "kitchen", "cooking", "chef", "tools"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Professional Knife Set - Hipa Marketplace",
        metaDescription: "Buy Professional Knife Set at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Outdoor & Gardening
    products.push({
      title: "Professional Lawn Mower",
      slug: "professional-lawn-mower",
      description: "21-inch self-propelled gas lawn mower",
      sellerId: seller1Profile._id,
      category: {
        primary: "Home, Garden & Tools",
        secondary: "Outdoor & Gardening",
        tertiary: "Lawn Mowers",
        path: ["Home, Garden & Tools", "Outdoor & Gardening", "Lawn Mowers"],
      },
      pricing: { base: 125000, compareAt: 140000, currency: "RWF" },
      inventory: {
        totalStock: 18,
        lowStockThreshold: 3,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
          alt: "Professional Lawn Mower",
          type: "image",
        },
      ],
      tags: ["lawn mower", "gardening", "outdoor", "tools", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Professional Lawn Mower - Hipa Marketplace",
        metaDescription: "Buy Professional Lawn Mower at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Patio Furniture Set",
      slug: "patio-furniture-set",
      description: "4-piece outdoor patio furniture set",
      sellerId: seller1Profile._id,
      category: {
        primary: "Home, Garden & Tools",
        secondary: "Outdoor & Gardening",
        tertiary: "Patio Sets",
        path: ["Home, Garden & Tools", "Outdoor & Gardening", "Patio Sets"],
      },
      pricing: { base: 280000, compareAt: 320000, currency: "RWF" },
      inventory: {
        totalStock: 8,
        lowStockThreshold: 2,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
          alt: "Patio Furniture Set",
          type: "image",
        },
      ],
      tags: ["patio", "furniture", "outdoor", "garden", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Patio Furniture Set - Hipa Marketplace",
        metaDescription: "Buy Patio Furniture Set at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. Fashion & Apparel - Genius Tech
    // Men's & Women's Clothing
    products.push({
      title: "Premium Denim Jeans",
      slug: "premium-denim-jeans",
      description: "High-quality stretch denim jeans for men and women",
      sellerId: seller1Profile._id,
      category: {
        primary: "Fashion & Apparel",
        secondary: "Men's & Women's Clothing",
        tertiary: "Denim Jeans",
        path: ["Fashion & Apparel", "Men's & Women's Clothing", "Denim Jeans"],
      },
      pricing: { base: 25000, compareAt: 30000, currency: "RWF" },
      inventory: {
        totalStock: 60,
        lowStockThreshold: 6,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
          alt: "Premium Denim Jeans",
          type: "image",
        },
      ],
      tags: ["jeans", "denim", "clothing", "fashion", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Premium Denim Jeans - Hipa Marketplace",
        metaDescription: "Buy Premium Denim Jeans at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Athletic Activewear Set",
      slug: "athletic-activewear-set",
      description: "Moisture-wicking activewear set for fitness",
      sellerId: seller1Profile._id,
      category: {
        primary: "Fashion & Apparel",
        secondary: "Men's & Women's Clothing",
        tertiary: "Activewear",
        path: ["Fashion & Apparel", "Men's & Women's Clothing", "Activewear"],
      },
      pricing: { base: 18000, compareAt: 22000, currency: "RWF" },
      inventory: {
        totalStock: 45,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1506629905607-1b06e052cc18?w=400",
          alt: "Athletic Activewear Set",
          type: "image",
        },
      ],
      tags: ["activewear", "fitness", "clothing", "sports", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Athletic Activewear Set - Hipa Marketplace",
        metaDescription: "Buy Athletic Activewear Set at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Footwear
    products.push({
      title: "Running Shoes - Nike",
      slug: "running-shoes-nike",
      description: "Professional running shoes with cushioning",
      sellerId: seller1Profile._id,
      category: {
        primary: "Fashion & Apparel",
        secondary: "Footwear",
        tertiary: "Running Shoes",
        path: ["Fashion & Apparel", "Footwear", "Running Shoes"],
      },
      pricing: { base: 45000, compareAt: 55000, currency: "RWF" },
      inventory: {
        totalStock: 40,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
          alt: "Running Shoes Nike",
          type: "image",
        },
      ],
      tags: ["running", "shoes", "nike", "sports", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Running Shoes Nike - Hipa Marketplace",
        metaDescription: "Buy Running Shoes Nike at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Leather Boots - Timberland",
      slug: "leather-boots-timberland",
      description: "Premium leather boots for all weather",
      sellerId: seller1Profile._id,
      category: {
        primary: "Fashion & Apparel",
        secondary: "Footwear",
        tertiary: "Leather Boots",
        path: ["Fashion & Apparel", "Footwear", "Leather Boots"],
      },
      pricing: { base: 65000, compareAt: 75000, currency: "RWF" },
      inventory: {
        totalStock: 30,
        lowStockThreshold: 4,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
          alt: "Leather Boots Timberland",
          type: "image",
        },
      ],
      tags: ["boots", "leather", "timberland", "fashion", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Leather Boots Timberland - Hipa Marketplace",
        metaDescription: "Buy Leather Boots Timberland at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Accessories
    products.push({
      title: "Designer Leather Wallet",
      slug: "designer-leather-wallet",
      description: "Premium leather wallet with multiple compartments",
      sellerId: seller1Profile._id,
      category: {
        primary: "Fashion & Apparel",
        secondary: "Accessories",
        tertiary: "Leather Wallets",
        path: ["Fashion & Apparel", "Accessories", "Leather Wallets"],
      },
      pricing: { base: 15000, compareAt: 20000, currency: "RWF" },
      inventory: {
        totalStock: 50,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400",
          alt: "Designer Leather Wallet",
          type: "image",
        },
      ],
      tags: ["wallet", "leather", "fashion", "accessories", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Designer Leather Wallet - Hipa Marketplace",
        metaDescription: "Buy Designer Leather Wallet at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Polarized Sunglasses",
      slug: "polarized-sunglasses",
      description: "UV protection polarized sunglasses",
      sellerId: seller1Profile._id,
      category: {
        primary: "Fashion & Apparel",
        secondary: "Accessories",
        tertiary: "Sunglasses",
        path: ["Fashion & Apparel", "Accessories", "Sunglasses"],
      },
      pricing: { base: 12000, compareAt: 15000, currency: "RWF" },
      inventory: {
        totalStock: 65,
        lowStockThreshold: 7,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
          alt: "Polarized Sunglasses",
          type: "image",
        },
      ],
      tags: ["sunglasses", "polarized", "uv", "accessories", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Polarized Sunglasses - Hipa Marketplace",
        metaDescription: "Buy Polarized Sunglasses at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 4. Sports, Outdoors & Travel - Genius Tech
    // Fitness & Gym
    products.push({
      title: "Adjustable Dumbbells Set",
      slug: "adjustable-dumbbells-set",
      description: "Complete set of adjustable dumbbells for home gym",
      sellerId: seller1Profile._id,
      category: {
        primary: "Sports, Outdoors & Travel",
        secondary: "Fitness & Gym",
        tertiary: "Dumbbells",
        path: ["Sports, Outdoors & Travel", "Fitness & Gym", "Dumbbells"],
      },
      pricing: { base: 120000, compareAt: 140000, currency: "RWF" },
      inventory: {
        totalStock: 15,
        lowStockThreshold: 2,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          alt: "Adjustable Dumbbells Set",
          type: "image",
        },
      ],
      tags: ["dumbbells", "fitness", "gym", "weights", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Adjustable Dumbbells Set - Hipa Marketplace",
        metaDescription: "Buy Adjustable Dumbbells Set at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Treadmill - Electric",
      slug: "treadmill-electric",
      description: "Electric treadmill with multiple speed settings",
      sellerId: seller1Profile._id,
      category: {
        primary: "Sports, Outdoors & Travel",
        secondary: "Fitness & Gym",
        tertiary: "Treadmills",
        path: ["Sports, Outdoors & Travel", "Fitness & Gym", "Treadmills"],
      },
      pricing: { base: 450000, compareAt: 500000, currency: "RWF" },
      inventory: {
        totalStock: 8,
        lowStockThreshold: 1,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          alt: "Electric Treadmill",
          type: "image",
        },
      ],
      tags: ["treadmill", "fitness", "gym", "running", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Electric Treadmill - Hipa Marketplace",
        metaDescription: "Buy Electric Treadmill at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Camping & Hiking
    products.push({
      title: "4-Person Camping Tent",
      slug: "4-person-camping-tent",
      description: "Waterproof 4-person camping tent",
      sellerId: seller1Profile._id,
      category: {
        primary: "Sports, Outdoors & Travel",
        secondary: "Camping & Hiking",
        tertiary: "Tents",
        path: ["Sports, Outdoors & Travel", "Camping & Hiking", "Tents"],
      },
      pricing: { base: 85000, compareAt: 95000, currency: "RWF" },
      inventory: {
        totalStock: 20,
        lowStockThreshold: 3,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=400",
          alt: "4-Person Camping Tent",
          type: "image",
        },
      ],
      tags: ["tent", "camping", "outdoor", "hiking", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "4-Person Camping Tent - Hipa Marketplace",
        metaDescription: "Buy 4-Person Camping Tent at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Hiking Backpack 50L",
      slug: "hiking-backpack-50l",
      description: "Professional hiking backpack with multiple compartments",
      sellerId: seller1Profile._id,
      category: {
        primary: "Sports, Outdoors & Travel",
        secondary: "Camping & Hiking",
        tertiary: "Hiking Boots",
        path: ["Sports, Outdoors & Travel", "Camping & Hiking", "Hiking Boots"],
      },
      pricing: { base: 35000, compareAt: 40000, currency: "RWF" },
      inventory: {
        totalStock: 25,
        lowStockThreshold: 3,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
          alt: "Hiking Backpack 50L",
          type: "image",
        },
      ],
      tags: ["backpack", "hiking", "outdoor", "camping", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Hiking Backpack 50L - Hipa Marketplace",
        metaDescription: "Buy Hiking Backpack 50L at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Luggage & Travel Gear
    products.push({
      title: "Carry-on Suitcase",
      slug: "carry-on-suitcase",
      description: "Lightweight carry-on suitcase with wheels",
      sellerId: seller1Profile._id,
      category: {
        primary: "Sports, Outdoors & Travel",
        secondary: "Luggage & Travel Gear",
        tertiary: "Carry-on Suitcases",
        path: [
          "Sports, Outdoors & Travel",
          "Luggage & Travel Gear",
          "Carry-on Suitcases",
        ],
      },
      pricing: { base: 65000, compareAt: 75000, currency: "RWF" },
      inventory: {
        totalStock: 18,
        lowStockThreshold: 2,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
          alt: "Carry-on Suitcase",
          type: "image",
        },
      ],
      tags: ["suitcase", "travel", "luggage", "carry-on", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Carry-on Suitcase - Hipa Marketplace",
        metaDescription: "Buy Carry-on Suitcase at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Travel Backpack",
      slug: "travel-backpack",
      description: "Multi-purpose travel backpack with laptop compartment",
      sellerId: seller1Profile._id,
      category: {
        primary: "Sports, Outdoors & Travel",
        secondary: "Luggage & Travel Gear",
        tertiary: "Backpacks",
        path: [
          "Sports, Outdoors & Travel",
          "Luggage & Travel Gear",
          "Backpacks",
        ],
      },
      pricing: { base: 28000, compareAt: 32000, currency: "RWF" },
      inventory: {
        totalStock: 30,
        lowStockThreshold: 4,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
          alt: "Travel Backpack",
          type: "image",
        },
      ],
      tags: ["backpack", "travel", "luggage", "laptop", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Travel Backpack - Hipa Marketplace",
        metaDescription: "Buy Travel Backpack at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 5. Automotive & Industrial - Genius Tech
    // Car Parts & Accessories
    products.push({
      title: "Premium Car Tires Set",
      slug: "premium-car-tires-set",
      description: "Set of 4 high-quality car tires with excellent grip",
      sellerId: seller1Profile._id,
      category: {
        primary: "Automotive & Industrial",
        secondary: "Car Parts & Accessories",
        tertiary: "Tires",
        path: ["Automotive & Industrial", "Car Parts & Accessories", "Tires"],
      },
      pricing: { base: 280000, compareAt: 320000, currency: "RWF" },
      inventory: {
        totalStock: 25,
        lowStockThreshold: 4,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
          alt: "Premium Car Tires Set",
          type: "image",
        },
      ],
      tags: ["tires", "car", "automotive", "parts", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Premium Car Tires Set - Hipa Marketplace",
        metaDescription: "Buy Premium Car Tires Set at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Dash Cam HD",
      slug: "dash-cam-hd",
      description: "1080p HD dash cam with night vision",
      sellerId: seller1Profile._id,
      category: {
        primary: "Automotive & Industrial",
        secondary: "Car Parts & Accessories",
        tertiary: "Dash Cams",
        path: [
          "Automotive & Industrial",
          "Car Parts & Accessories",
          "Dash Cams",
        ],
      },
      pricing: { base: 45000, compareAt: 55000, currency: "RWF" },
      inventory: {
        totalStock: 35,
        lowStockThreshold: 4,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
          alt: "HD Dash Cam",
          type: "image",
        },
      ],
      tags: ["dash cam", "camera", "automotive", "security", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "HD Dash Cam - Hipa Marketplace",
        metaDescription: "Buy HD Dash Cam at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Tools & Equipment
    products.push({
      title: "Cordless Power Drill",
      slug: "cordless-power-drill",
      description: "Professional cordless power drill with multiple bits",
      sellerId: seller1Profile._id,
      category: {
        primary: "Automotive & Industrial",
        secondary: "Tools & Equipment",
        tertiary: "Power Drills",
        path: ["Automotive & Industrial", "Tools & Equipment", "Power Drills"],
      },
      pricing: { base: 85000, compareAt: 95000, currency: "RWF" },
      inventory: {
        totalStock: 30,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
          alt: "Cordless Power Drill",
          type: "image",
        },
      ],
      tags: ["drill", "power", "tools", "cordless", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Cordless Power Drill - Hipa Marketplace",
        metaDescription: "Buy Cordless Power Drill at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Professional Workbench",
      slug: "professional-workbench",
      description: "Heavy-duty workbench for professional use",
      sellerId: seller1Profile._id,
      category: {
        primary: "Automotive & Industrial",
        secondary: "Tools & Equipment",
        tertiary: "Workbenches",
        path: ["Automotive & Industrial", "Tools & Equipment", "Workbenches"],
      },
      pricing: { base: 150000, compareAt: 180000, currency: "RWF" },
      inventory: {
        totalStock: 12,
        lowStockThreshold: 2,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
          alt: "Professional Workbench",
          type: "image",
        },
      ],
      tags: ["workbench", "tools", "industrial", "professional", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Professional Workbench - Hipa Marketplace",
        metaDescription: "Buy Professional Workbench at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 6. Pet Supplies - Genius Tech
    // Pet Food & Treats
    products.push({
      title: "Premium Dog Food",
      slug: "premium-dog-food",
      description: "Nutritionally balanced dry dog food for all breeds",
      sellerId: seller1Profile._id,
      category: {
        primary: "Pet Supplies",
        secondary: "Pet Food & Treats",
        tertiary: "Dry Dog Food",
        path: ["Pet Supplies", "Pet Food & Treats", "Dry Dog Food"],
      },
      pricing: { base: 25000, compareAt: 30000, currency: "RWF" },
      inventory: {
        totalStock: 80,
        lowStockThreshold: 8,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
          alt: "Premium Dog Food",
          type: "image",
        },
      ],
      tags: ["dog food", "pet", "nutrition", "dry", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Premium Dog Food - Hipa Marketplace",
        metaDescription: "Buy Premium Dog Food at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Cat Treats Variety Pack",
      slug: "cat-treats-variety-pack",
      description: "Assortment of healthy cat treats and snacks",
      sellerId: seller1Profile._id,
      category: {
        primary: "Pet Supplies",
        secondary: "Pet Food & Treats",
        tertiary: "Catnip",
        path: ["Pet Supplies", "Pet Food & Treats", "Catnip"],
      },
      pricing: { base: 8000, compareAt: 10000, currency: "RWF" },
      inventory: {
        totalStock: 60,
        lowStockThreshold: 6,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
          alt: "Cat Treats Variety Pack",
          type: "image",
        },
      ],
      tags: ["cat treats", "pet", "snacks", "variety", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Cat Treats Variety Pack - Hipa Marketplace",
        metaDescription: "Buy Cat Treats Variety Pack at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Pet Care & Toys
    products.push({
      title: "Dog Leash and Collar Set",
      slug: "dog-leash-collar-set",
      description: "Durable leather dog leash and collar set",
      sellerId: seller1Profile._id,
      category: {
        primary: "Pet Supplies",
        secondary: "Pet Care & Toys",
        tertiary: "Dog Leashes",
        path: ["Pet Supplies", "Pet Care & Toys", "Dog Leashes"],
      },
      pricing: { base: 12000, compareAt: 15000, currency: "RWF" },
      inventory: {
        totalStock: 45,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
          alt: "Dog Leash and Collar Set",
          type: "image",
        },
      ],
      tags: ["dog leash", "collar", "pet", "leather", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Dog Leash and Collar Set - Hipa Marketplace",
        metaDescription: "Buy Dog Leash and Collar Set at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Aquarium Fish Tank",
      slug: "aquarium-fish-tank",
      description: "20-gallon complete aquarium setup for freshwater fish",
      sellerId: seller1Profile._id,
      category: {
        primary: "Pet Supplies",
        secondary: "Pet Care & Toys",
        tertiary: "Fish Tanks",
        path: ["Pet Supplies", "Pet Care & Toys", "Fish Tanks"],
      },
      pricing: { base: 85000, compareAt: 95000, currency: "RWF" },
      inventory: {
        totalStock: 20,
        lowStockThreshold: 3,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
          alt: "Aquarium Fish Tank",
          type: "image",
        },
      ],
      tags: ["fish tank", "aquarium", "pet", "freshwater", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Aquarium Fish Tank - Hipa Marketplace",
        metaDescription: "Buy Aquarium Fish Tank at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 7. Digital Products - Genius Tech
    // Software & Apps
    products.push({
      title: "Productivity Software Suite",
      slug: "productivity-software-suite",
      description:
        "Complete productivity software package with lifetime license",
      sellerId: seller1Profile._id,
      category: {
        primary: "Digital Products",
        secondary: "Software & Apps",
        tertiary: "Productivity Tools",
        path: ["Digital Products", "Software & Apps", "Productivity Tools"],
      },
      pricing: { base: 50000, compareAt: 75000, currency: "RWF" },
      inventory: {
        totalStock: 999,
        lowStockThreshold: 10,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
          alt: "Productivity Software Suite",
          type: "image",
        },
      ],
      tags: ["software", "productivity", "digital", "license", "tools"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Productivity Software Suite - Hipa Marketplace",
        metaDescription: "Buy Productivity Software Suite at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Mobile Game Collection",
      slug: "mobile-game-collection",
      description: "Premium mobile games bundle with lifetime access",
      sellerId: seller1Profile._id,
      category: {
        primary: "Digital Products",
        secondary: "Software & Apps",
        tertiary: "Mobile Games",
        path: ["Digital Products", "Software & Apps", "Mobile Games"],
      },
      pricing: { base: 25000, compareAt: 35000, currency: "RWF" },
      inventory: {
        totalStock: 999,
        lowStockThreshold: 10,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1556438064-2d7646166914?w=400",
          alt: "Mobile Game Collection",
          type: "image",
        },
      ],
      tags: ["games", "mobile", "digital", "entertainment", "software"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Mobile Game Collection - Hipa Marketplace",
        metaDescription: "Buy Mobile Game Collection at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // E-Learning & Media
    products.push({
      title: "Online Course Bundle",
      slug: "online-course-bundle",
      description: "Complete e-learning courses in business and technology",
      sellerId: seller1Profile._id,
      category: {
        primary: "Digital Products",
        secondary: "E-Learning & Media",
        tertiary: "Online Courses",
        path: ["Digital Products", "E-Learning & Media", "Online Courses"],
      },
      pricing: { base: 75000, compareAt: 100000, currency: "RWF" },
      inventory: {
        totalStock: 999,
        lowStockThreshold: 10,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400",
          alt: "Online Course Bundle",
          type: "image",
        },
      ],
      tags: ["courses", "e-learning", "education", "digital", "business"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Online Course Bundle - Hipa Marketplace",
        metaDescription: "Buy Online Course Bundle at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Digital E-book Library",
      slug: "digital-e-book-library",
      description: "Access to premium e-book collection with lifetime license",
      sellerId: seller1Profile._id,
      category: {
        primary: "Digital Products",
        secondary: "E-Learning & Media",
        tertiary: "E-books",
        path: ["Digital Products", "E-Learning & Media", "E-books"],
      },
      pricing: { base: 35000, compareAt: 50000, currency: "RWF" },
      inventory: {
        totalStock: 999,
        lowStockThreshold: 10,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
          alt: "Digital E-book Library",
          type: "image",
        },
      ],
      tags: ["e-books", "digital", "library", "reading", "education"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Digital E-book Library - Hipa Marketplace",
        metaDescription: "Buy Digital E-book Library at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Now Fresh Facte Ltd - Perishable Goods
    // 8. Groceries & Essentials - Fresh Facte Ltd
    // Fresh & Frozen Food
    products.push({
      title: "Organic Produce Bundle",
      slug: "organic-produce-bundle",
      description: "Fresh organic vegetables and fruits bundle",
      sellerId: seller2Profile._id,
      category: {
        primary: "Groceries & Essentials",
        secondary: "Fresh & Frozen Food",
        tertiary: "Organic Produce",
        path: [
          "Groceries & Essentials",
          "Fresh & Frozen Food",
          "Organic Produce",
        ],
      },
      pricing: { base: 15000, compareAt: 18000, currency: "RWF" },
      inventory: {
        totalStock: 100,
        lowStockThreshold: 10,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400",
          alt: "Organic Produce Bundle",
          type: "image",
        },
      ],
      tags: ["organic", "produce", "vegetables", "fresh", "healthy"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Organic Produce Bundle - Hipa Marketplace",
        metaDescription: "Buy Organic Produce Bundle at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Frozen Pizza Collection",
      slug: "frozen-pizza-collection",
      description: "Assortment of frozen pizzas - ready to bake",
      sellerId: seller2Profile._id,
      category: {
        primary: "Groceries & Essentials",
        secondary: "Fresh & Frozen Food",
        tertiary: "Frozen Pizzas",
        path: [
          "Groceries & Essentials",
          "Fresh & Frozen Food",
          "Frozen Pizzas",
        ],
      },
      pricing: { base: 12000, compareAt: 15000, currency: "RWF" },
      inventory: {
        totalStock: 80,
        lowStockThreshold: 8,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
          alt: "Frozen Pizza Collection",
          type: "image",
        },
      ],
      tags: ["pizza", "frozen", "food", "ready-to-eat", "convenient"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Frozen Pizza Collection - Hipa Marketplace",
        metaDescription: "Buy Frozen Pizza Collection at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Household Supplies
    products.push({
      title: "Laundry Detergent Bundle",
      slug: "laundry-detergent-bundle",
      description: "Eco-friendly laundry detergent 5L bottles",
      sellerId: seller2Profile._id,
      category: {
        primary: "Groceries & Essentials",
        secondary: "Household Supplies",
        tertiary: "Laundry Detergent",
        path: [
          "Groceries & Essentials",
          "Household Supplies",
          "Laundry Detergent",
        ],
      },
      pricing: { base: 8000, compareAt: 10000, currency: "RWF" },
      inventory: {
        totalStock: 120,
        lowStockThreshold: 12,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400",
          alt: "Laundry Detergent Bundle",
          type: "image",
        },
      ],
      tags: ["laundry", "detergent", "cleaning", "household", "eco-friendly"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Laundry Detergent Bundle - Hipa Marketplace",
        metaDescription: "Buy Laundry Detergent Bundle at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Toilet Paper Pack",
      slug: "toilet-paper-pack",
      description: "Soft and durable toilet paper 24-roll pack",
      sellerId: seller2Profile._id,
      category: {
        primary: "Groceries & Essentials",
        secondary: "Household Supplies",
        tertiary: "Toilet Paper",
        path: ["Groceries & Essentials", "Household Supplies", "Toilet Paper"],
      },
      pricing: { base: 6000, compareAt: 8000, currency: "RWF" },
      inventory: {
        totalStock: 150,
        lowStockThreshold: 15,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400",
          alt: "Toilet Paper Pack",
          type: "image",
        },
      ],
      tags: ["toilet paper", "household", "essentials", "soft", "durable"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Toilet Paper Pack - Hipa Marketplace",
        metaDescription: "Buy Toilet Paper Pack at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 9. Health, Beauty & Personal Care - Fresh Facte Ltd
    // Skincare & Cosmetics
    products.push({
      title: "Moisturizing Cream Set",
      slug: "moisturizing-cream-set",
      description: "Complete skincare routine with natural moisturizers",
      sellerId: seller2Profile._id,
      category: {
        primary: "Health, Beauty & Personal Care",
        secondary: "Skincare & Cosmetics",
        tertiary: "Moisturizers",
        path: [
          "Health, Beauty & Personal Care",
          "Skincare & Cosmetics",
          "Moisturizers",
        ],
      },
      pricing: { base: 25000, compareAt: 30000, currency: "RWF" },
      inventory: {
        totalStock: 60,
        lowStockThreshold: 6,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400",
          alt: "Moisturizing Cream Set",
          type: "image",
        },
      ],
      tags: ["moisturizer", "skincare", "cosmetics", "beauty", "natural"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Moisturizing Cream Set - Hipa Marketplace",
        metaDescription: "Buy Moisturizing Cream Set at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Foundation Makeup Kit",
      slug: "foundation-makeup-kit",
      description: "Professional foundation makeup with brushes",
      sellerId: seller2Profile._id,
      category: {
        primary: "Health, Beauty & Personal Care",
        secondary: "Skincare & Cosmetics",
        tertiary: "Foundation Makeup",
        path: [
          "Health, Beauty & Personal Care",
          "Skincare & Cosmetics",
          "Foundation Makeup",
        ],
      },
      pricing: { base: 18000, compareAt: 22000, currency: "RWF" },
      inventory: {
        totalStock: 45,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400",
          alt: "Foundation Makeup Kit",
          type: "image",
        },
      ],
      tags: ["foundation", "makeup", "cosmetics", "beauty", "professional"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Foundation Makeup Kit - Hipa Marketplace",
        metaDescription: "Buy Foundation Makeup Kit at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Haircare & Grooming
    products.push({
      title: "Professional Hair Dryer",
      slug: "professional-hair-dryer",
      description: "Ionic hair dryer with multiple heat settings",
      sellerId: seller2Profile._id,
      category: {
        primary: "Health, Beauty & Personal Care",
        secondary: "Haircare & Grooming",
        tertiary: "Hair Dryers",
        path: [
          "Health, Beauty & Personal Care",
          "Haircare & Grooming",
          "Hair Dryers",
        ],
      },
      pricing: { base: 35000, compareAt: 40000, currency: "RWF" },
      inventory: {
        totalStock: 40,
        lowStockThreshold: 4,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
          alt: "Professional Hair Dryer",
          type: "image",
        },
      ],
      tags: ["hair dryer", "grooming", "beauty", "professional", "ionic"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Professional Hair Dryer - Hipa Marketplace",
        metaDescription: "Buy Professional Hair Dryer at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Electric Shaver Set",
      slug: "electric-shaver-set",
      description: "Cordless electric shaver with precision trimmer",
      sellerId: seller2Profile._id,
      category: {
        primary: "Health, Beauty & Personal Care",
        secondary: "Haircare & Grooming",
        tertiary: "Electric Shavers",
        path: [
          "Health, Beauty & Personal Care",
          "Haircare & Grooming",
          "Electric Shavers",
        ],
      },
      pricing: { base: 28000, compareAt: 32000, currency: "RWF" },
      inventory: {
        totalStock: 35,
        lowStockThreshold: 4,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
          alt: "Electric Shaver Set",
          type: "image",
        },
      ],
      tags: ["shaver", "electric", "grooming", "cordless", "precision"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Electric Shaver Set - Hipa Marketplace",
        metaDescription: "Buy Electric Shaver Set at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Health & Wellness
    products.push({
      title: "Multivitamin Supplement",
      slug: "multivitamin-supplement",
      description: "Daily multivitamin tablets for overall health",
      sellerId: seller2Profile._id,
      category: {
        primary: "Health, Beauty & Personal Care",
        secondary: "Health & Wellness",
        tertiary: "Multivitamins",
        path: [
          "Health, Beauty & Personal Care",
          "Health & Wellness",
          "Multivitamins",
        ],
      },
      pricing: { base: 15000, compareAt: 18000, currency: "RWF" },
      inventory: {
        totalStock: 90,
        lowStockThreshold: 9,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1550572017-edd951aa8ca9?w=400",
          alt: "Multivitamin Supplement",
          type: "image",
        },
      ],
      tags: ["multivitamin", "supplement", "health", "wellness", "daily"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Multivitamin Supplement - Hipa Marketplace",
        metaDescription: "Buy Multivitamin Supplement at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Yoga Mat Premium",
      slug: "yoga-mat-premium",
      description: "Non-slip premium yoga mat for all exercises",
      sellerId: seller2Profile._id,
      category: {
        primary: "Health, Beauty & Personal Care",
        secondary: "Health & Wellness",
        tertiary: "Yoga Mats",
        path: [
          "Health, Beauty & Personal Care",
          "Health & Wellness",
          "Yoga Mats",
        ],
      },
      pricing: { base: 22000, compareAt: 25000, currency: "RWF" },
      inventory: {
        totalStock: 50,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1550572017-edd951aa8ca9?w=400",
          alt: "Premium Yoga Mat",
          type: "image",
        },
      ],
      tags: ["yoga mat", "exercise", "fitness", "non-slip", "premium"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Premium Yoga Mat - Hipa Marketplace",
        metaDescription: "Buy Premium Yoga Mat at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 10. Baby & Kids - Fresh Facte Ltd
    // Toys & Games
    products.push({
      title: "LEGO Building Set",
      slug: "lego-building-set",
      description: "Creative LEGO building blocks for educational play",
      sellerId: seller2Profile._id,
      category: {
        primary: "Baby & Kids",
        secondary: "Toys & Games",
        tertiary: "LEGO Sets",
        path: ["Baby & Kids", "Toys & Games", "LEGO Sets"],
      },
      pricing: { base: 35000, compareAt: 40000, currency: "RWF" },
      inventory: {
        totalStock: 35,
        lowStockThreshold: 3,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400",
          alt: "LEGO Building Set",
          type: "image",
        },
      ],
      tags: ["lego", "building", "toys", "educational", "creative"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "LEGO Building Set - Hipa Marketplace",
        metaDescription: "Buy LEGO Building Set at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Board Games Collection",
      slug: "board-games-collection",
      description: "Family board games set for indoor entertainment",
      sellerId: seller2Profile._id,
      category: {
        primary: "Baby & Kids",
        secondary: "Toys & Games",
        tertiary: "Board Games",
        path: ["Baby & Kids", "Toys & Games", "Board Games"],
      },
      pricing: { base: 25000, compareAt: 30000, currency: "RWF" },
      inventory: {
        totalStock: 40,
        lowStockThreshold: 4,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400",
          alt: "Board Games Collection",
          type: "image",
        },
      ],
      tags: ["board games", "family", "entertainment", "indoor", "fun"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Board Games Collection - Hipa Marketplace",
        metaDescription: "Buy Board Games Collection at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Baby Essentials
    products.push({
      title: "Diaper Bundle Pack",
      slug: "diaper-bundle-pack",
      description: "Premium baby diapers with moisture control",
      sellerId: seller2Profile._id,
      category: {
        primary: "Baby & Kids",
        secondary: "Baby Essentials",
        tertiary: "Diapers",
        path: ["Baby & Kids", "Baby Essentials", "Diapers"],
      },
      pricing: { base: 18000, compareAt: 22000, currency: "RWF" },
      inventory: {
        totalStock: 75,
        lowStockThreshold: 8,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=400",
          alt: "Diaper Bundle Pack",
          type: "image",
        },
      ],
      tags: ["diapers", "baby", "essentials", "moisture", "premium"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Diaper Bundle Pack - Hipa Marketplace",
        metaDescription: "Buy Diaper Bundle Pack at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    products.push({
      title: "Baby Stroller Deluxe",
      slug: "baby-stroller-deluxe",
      description: "Foldable baby stroller with safety features",
      sellerId: seller2Profile._id,
      category: {
        primary: "Baby & Kids",
        secondary: "Baby Essentials",
        tertiary: "Baby Strollers",
        path: ["Baby & Kids", "Baby Essentials", "Baby Strollers"],
      },
      pricing: { base: 120000, compareAt: 140000, currency: "RWF" },
      inventory: {
        totalStock: 20,
        lowStockThreshold: 2,
        trackInventory: true,
        allowBackorder: false,
      },
      media: [
        {
          url: "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=400",
          alt: "Baby Stroller Deluxe",
          type: "image",
        },
      ],
      tags: ["stroller", "baby", "foldable", "safety", "deluxe"],
      condition: "new",
      status: "active",
      seo: {
        metaTitle: "Baby Stroller Deluxe - Hipa Marketplace",
        metaDescription: "Buy Baby Stroller Deluxe at best price",
      },
      stats: { views: 0, likes: 0, shares: 0, rating: 0, reviewCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert products
    await db.collection("products").insertMany(products);
    console.log(`✅ Created ${products.length} products across all categories`);

    // Set finance schema to zero
    console.log("Setting finance metrics to zero...");

    const financeData = {
      totalRevenue: 0,
      totalOrders: 0,
      totalProductsSold: 0,
      totalCustomers: 0,
      monthlyRevenue: 0,
      monthlyOrders: 0,
      averageOrderValue: 0,
      topProducts: [],
      revenueByCategory: [],
      salesByMonth: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("finance").insertOne(financeData);
    console.log("✅ Finance metrics set to zero");

    // Clean up temporary files
    console.log("Cleaning up temporary files...");
    // Note: We'll handle cleanup after successful execution

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("Summary:");
    console.log("- 4 users created (1 superadmin, 1 buyer, 2 sellers)");
    console.log(
      `- ${products.length} products created across all 10 major categories`,
    );
    console.log("- Finance metrics initialized to zero");

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
