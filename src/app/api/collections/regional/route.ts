import { NextResponse } from 'next/server';
import mongoose from 'mongoose';


export const dynamic = "force-dynamic";
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa';

// Cache for database connection
let cachedConn: mongoose.Connection | null = null;

async function getDb() {
  if (cachedConn && cachedConn.readyState === 1) {
    return cachedConn;
  }
  
  const opts = {
    bufferCommands: false,
  };
  
  const conn = await mongoose.connect(MONGODB_URI, opts);
  cachedConn = conn.connection;
  return cachedConn;
}

// African regions mapping
const REGIONS = [
  { id: 'east-africa', name: 'East Africa', countries: ['Rwanda', 'Kenya', 'Uganda', 'Tanzania'] },
  { id: 'west-africa', name: 'West Africa', countries: ['Nigeria', 'Ghana', 'Ivory Coast', 'Senegal'] },
  { id: 'southern-africa', name: 'Southern Africa', countries: ['South Africa', 'Zimbabwe', 'Zambia', 'Mozambique'] },
  { id: 'north-africa', name: 'North Africa', countries: ['Egypt', 'Morocco', 'Tunisia', 'Algeria'] },
  { id: 'central-africa', name: 'Central Africa', countries: ['Cameroon', 'DRC', 'Gabon', 'Congo'] },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const region = searchParams.get('region');
    
    const db = await getDb();
    
    // Get all sellers with location for regional aggregation
    const sellers = await db.collection('sellers')
      .find({ kycStatus: 'verified' })
      .project({
        _id: 1,
        store: 1,
        tier: 1,
        stats: 1,
        'store.location': 1,
        'store.cityCoords': 1
      })
      .toArray();
    
    // Group sellers by region based on location
    const regionalData: Record<string, unknown> = {};
    
    for (const r of REGIONS) {
      const regionSellers = sellers.filter((s: Record<string, unknown>) => {
        const location = (s.store as Record<string, unknown>)?.location as string;
        if (!location) return false;
        return r.countries.some(c => location.toLowerCase().includes(c.toLowerCase()));
      });
      
      // Get unique products from these sellers
      const sellerIds = regionSellers.map((s: Record<string, unknown>) => s._id);
      
      const products = await db.collection('products')
        .find({ 
          sellerId: { $in: sellerIds },
          status: 'active',
          'inventory.totalStock': { $gt: 0 }
        })
        .project({
          _id: 1,
          title: 1,
          slug: 1,
          pricing: 1,
          media: 1,
          category: 1,
          stats: 1
        })
        .limit(limit)
        .toArray();
      
      regionalData[r.id] = {
        region: r,
        sellers: regionSellers,
        products,
        productCount: products.length,
        sellerCount: regionSellers.length
      };
    }
    
    // Filter by specific region if requested
    if (region && regionalData[region]) {
      return NextResponse.json({
        success: true,
        data: regionalData[region],
        allRegions: Object.keys(regionalData)
      });
    }
    
    return NextResponse.json({
      success: true,
      data: regionalData,
      regions: REGIONS
    });
    
  } catch (error) {
    console.error('Error fetching regional collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch regional collections' },
      { status: 500 }
    );
  }
}
