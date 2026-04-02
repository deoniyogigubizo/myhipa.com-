import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

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

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userLat = parseFloat(searchParams.get('lat') || '0');
    const userLng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '10'); // Default 10km

    if (!userLat || !userLng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    const db = await getDb();

    // Get all sellers with store information
    const sellers = await db.collection('users').find({
      role: 'seller',
      isActive: true,
      suspendedAt: null,
      'store.location': { $exists: true }
    }).toArray();

    // Filter sellers within radius and calculate distances
    const nearbySellers = sellers
      .filter(seller => {
        if (!seller.store?.location?.coordinates?.lat || !seller.store?.location?.coordinates?.lng) return false;

        const distance = calculateDistance(
          userLat,
          userLng,
          seller.store.location.coordinates.lat,
          seller.store.location.coordinates.lng
        );

        return distance <= radius;
      })
      .map(seller => {
        const distance = calculateDistance(
          userLat,
          userLng,
          seller.store.location.coordinates.lat,
          seller.store.location.coordinates.lng
        );

        return {
          id: seller._id.toString(),
          name: seller.store.name || 'Unknown Store',
          distance_km: Math.round(distance * 10) / 10, // Round to 1 decimal
          image_url: seller.profile?.avatar || 'https://via.placeholder.com/150',
          offer: seller.store.description || 'Check out our products',
          category: seller.store.categories?.[0] || 'General',
          address: `${seller.store.location?.city || ''}, ${seller.store.location?.country || ''}`,
          rating: seller.store.stats?.averageRating || 4.5,
          products_count: seller.store.stats?.totalProducts || 0
        };
      })
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 8); // Limit to 8 results

    return NextResponse.json(nearbySellers);
  } catch (error) {
    console.error('Error fetching nearby shops:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}