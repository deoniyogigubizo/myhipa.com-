'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/store/cartStore';
import { useAuth } from '@/lib/hooks/useAuth';

interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string;
  banner: string;
  bio: string;
  rating: number;
  reviewCount: number;
  totalSales: number;
  responseRate: number;
  responseTime: string;
  joinedDate: string;
  location: string;
  verified: boolean;
  badges: string[];
  categories: string[];
}

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  rating: number;
  stock: number;
  slug: string;
}

interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
  helpful: number;
}

interface CommunityPost {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  likes: number;
  comments: number;
  time: string;
}

export default function SellerStorePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCartStore();
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowTooltip, setShowFollowTooltip] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [b2bSearchQuery, setB2bSearchQuery] = useState('');
  const [b2bSearchCategory, setB2bSearchCategory] = useState('');
  const [b2bSearchResults, setB2bSearchResults] = useState<any[]>([]);
  const [b2bSearching, setB2bSearching] = useState(false);

  useEffect(() => {
    async function fetchStoreData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/stores/${slug}`);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch store');
        }
        
        setStore(data.data.store);
        setProducts(data.data.products);
        setReviews(data.data.reviews);
        setCommunityPosts(data.data.communityPosts);
        
        // Check if user is following this store
        if (isAuthenticated && user) {
          const followResponse = await fetch(`/api/stores/${slug}/follow`);
          if (followResponse.ok) {
            const followData = await followResponse.json();
            setIsFollowing(followData.isFollowing);
          }
        }
      } catch (err) {
        console.error('Error fetching store:', err);
        setError(err instanceof Error ? err.message : 'Failed to load store');
      } finally {
        setLoading(false);
      }
    }
    
    if (slug) {
      fetchStoreData();
    }
  }, [slug, isAuthenticated, user]);

  async function handleFollow() {
    if (!isAuthenticated) {
      setShowFollowTooltip(true);
      return;
    }

    try {
      setFollowLoading(true);
      const response = await fetch(`/api/stores/${slug}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowLoading(false);
    }
  }

  function handleChat() {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/store/${slug}`);
      return;
    }
    router.push(`/messages?store=${slug}`);
  }

  async function handleB2bSearch() {
    if (!b2bSearchQuery.trim()) return;

    try {
      setB2bSearching(true);
      const params = new URLSearchParams();
      params.append('q', b2bSearchQuery);
      if (b2bSearchCategory) params.append('category', b2bSearchCategory);

      const response = await fetch(`/api/products/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setB2bSearchResults(data.data);
      }
    } catch (error) {
      console.error('B2B search error:', error);
    } finally {
      setB2bSearching(false);
    }
  }

  function handleB2bCategorySelect(category: string) {
    setB2bSearchCategory(category);
    // You could trigger search here or just set the category
  }

  function handleQuickSearch(term: string) {
    setB2bSearchQuery(term);
    // Trigger search immediately
    setTimeout(() => handleB2bSearch(), 100);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading store...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The store you are looking for does not exist.'}</p>
            <p className="text-sm text-gray-500 mb-6">
              This might be because the database hasn't been seeded with test data yet.
              <br />
              Try running: <code className="bg-gray-100 px-2 py-1 rounded">npm run seed</code>
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/stores" className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                Browse Stores
              </Link>
              <Link href="/" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Go Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        {/* Banner */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-teal-600 to-teal-800">
          <Image src={store.banner} alt={store.name} fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Store Info */}
        <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-32 h-32 relative rounded-xl overflow-hidden border-4 border-white shadow-md -mt-16 md:-mt-12 flex-shrink-0">
                <Image src={store.logo} alt={store.name} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
                  {store.verified && (
                    <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {store.badges.map((badge) => (
                    <span key={badge} className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">{badge}</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4">{store.bio}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> {store.rating.toFixed(1)} ({store.reviewCount} reviews)</span>
                  <span>📦 {store.totalSales.toLocaleString()} sales</span>
                  <span>📍 {typeof store.location === 'string' 
                    ? store.location 
                    : 'Location not specified'}</span>
                  <span>📅 Joined {store.joinedDate}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 relative">
                <div className="relative">
                  <button 
                    onClick={handleFollow} 
                    onMouseEnter={() => !isAuthenticated && setShowFollowTooltip(true)}
                    onMouseLeave={() => setShowFollowTooltip(false)}
                    disabled={followLoading}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${isFollowing ? 'bg-gray-100 text-gray-700 border border-gray-300' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                  >
                    {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                  {showFollowTooltip && !isAuthenticated && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-lg shadow-lg border border-gray-200 z-20 w-64">
                      <p className="text-sm text-gray-700 mb-2">Sign in to follow this store</p>
                      <div className="flex gap-2">
                        <Link href={`/login?redirect=/store/${slug}`} className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700">
                          Login
                        </Link>
                        <Link href={`/signup?redirect=/store/${slug}`} className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                          Register
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={handleChat} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Chat
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center"><div className="text-2xl font-bold text-gray-900">{store.totalSales.toLocaleString()}</div><div className="text-sm text-gray-500">Total Sales</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-gray-900">{store.responseRate}%</div><div className="text-sm text-gray-500">Response Rate</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-gray-900">{store.responseTime}</div><div className="text-sm text-gray-500">Response Time</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-gray-900">{store.rating.toFixed(1)}</div><div className="text-sm text-gray-500">Rating</div></div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            {['products', 'reviews', 'community', 'b2b'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 font-medium capitalize transition-colors ${activeTab === tab ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab === 'b2b' ? 'B2B' : tab}
              </button>
            ))}
          </div>

          {/* Products */}
          {activeTab === 'products' && (
            <div className="py-6">
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {store.categories.map((cat) => (
                  <button key={cat} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:border-teal-500 hover:text-teal-600 whitespace-nowrap">{cat}</button>
                ))}
              </div>
              {products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <Link key={product.id} href={`/product/${product.slug || product.id}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
                      <div className="relative aspect-square bg-gray-100">
                        <Image src={product.image} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-teal-600">{product.title}</h3>
                        <div className="flex items-center gap-1 mt-1"><svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg><span className="text-xs text-gray-500">{product.rating.toFixed(1)}</span></div>
                        <p className="font-bold text-gray-900 mt-1">{product.price?.toLocaleString() ?? '0'} RWF</p>
                        {/* Add to Cart Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addItem({
                              productId: product.id,
                              slug: product.slug,
                              title: product.title,
                              image: product.image,
                              price: product.price || 0,
                              quantity: 1,
                              sellerId: store?.id || '',
                              sellerName: store?.name || 'Unknown Seller',
                            });
                          }}
                          className="w-full mt-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: '#0d9488', color: 'white' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Add to Cart
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📦</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Yet</h3>
                  <p className="text-gray-600">This store hasn't added any products yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div className="py-6">
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-100">
                          <Image src={review.avatar} alt={review.author} fill className="object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{review.author}</span>
                            <span className="text-xs text-gray-400">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[1,2,3,4,5].map((s) => <svg key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                          </div>
                          <p className="text-gray-600 text-sm">{review.content}</p>
                          <button className="text-sm text-gray-500 hover:text-teal-600 mt-2">{review.helpful} found helpful</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">⭐</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-600">This store hasn't received any reviews yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Community */}
          {activeTab === 'community' && (
            <div className="py-6">
              {communityPosts.length > 0 ? (
                <div className="space-y-4">
                  {communityPosts.map((post) => (
                    <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-100">
                          <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{post.author.name}</span>
                            <span className="text-xs text-gray-400">• {post.time}</span>
                          </div>
                          <p className="text-gray-600">{post.content}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <button className="flex items-center gap-1 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>{post.likes}</button>
                            <button className="flex items-center gap-1 hover:text-teal-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>{post.comments}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Community Posts</h3>
                  <p className="text-gray-600">This store hasn't posted any community updates yet.</p>
                </div>
              )}
            </div>
          )}

          {/* B2B */}
          {activeTab === 'b2b' && (
            <div className="py-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Search & Discover</h2>

                {/* Search Bar */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={b2bSearchQuery}
                      onChange={(e) => setB2bSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleB2bSearch()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <button
                    onClick={handleB2bSearch}
                    disabled={b2bSearching}
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
                  >
                    {b2bSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {/* Categories */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <button
                    onClick={() => handleB2bCategorySelect('raw_materials')}
                    className={`p-4 border rounded-lg transition-colors ${
                      b2bSearchCategory === 'raw_materials'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-500 hover:bg-teal-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">🏭</div>
                    <div className="font-medium text-gray-900">Raw Materials</div>
                  </button>
                  <button
                    onClick={() => handleB2bCategorySelect('products')}
                    className={`p-4 border rounded-lg transition-colors ${
                      b2bSearchCategory === 'products'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-500 hover:bg-teal-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">📦</div>
                    <div className="font-medium text-gray-900">Products</div>
                  </button>
                  <button
                    onClick={() => handleB2bCategorySelect('manufacturers')}
                    className={`p-4 border rounded-lg transition-colors ${
                      b2bSearchCategory === 'manufacturers'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-500 hover:bg-teal-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">🏢</div>
                    <div className="font-medium text-gray-900">Manufacturers</div>
                  </button>
                  <button
                    onClick={() => handleB2bCategorySelect('worldwide')}
                    className={`p-4 border rounded-lg transition-colors ${
                      b2bSearchCategory === 'worldwide'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-500 hover:bg-teal-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">🌍</div>
                    <div className="font-medium text-gray-900">Worldwide</div>
                  </button>
                </div>

                {/* Additional Search Options */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <button
                    onClick={() => handleQuickSearch('wireless headphones')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    🎧 Wireless Headphones
                  </button>
                  <button
                    onClick={() => {
                      // For image search, you could open a file picker or modal
                      alert('Image search feature coming soon!');
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    🔍 Image Search
                  </button>
                  <button
                    onClick={() => {
                      // For advanced search, you could show additional filters
                      alert('Advanced search feature coming soon!');
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    📱 Advanced Search
                  </button>
                </div>

                {/* B2B Contact Form */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">B2B Bulk Orders</h3>
                  <p className="text-gray-600 mb-4">Need bulk quantities? Contact us for special pricing.</p>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label><input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Products Interested In</label><input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity Needed</label><input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Message</label><textarea rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"></textarea></div>
                    <button type="submit" className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700">Request Quote</button>
                  </form>
                </div>

                {/* Search Results */}
                {b2bSearchResults.length > 0 && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {b2bSearchResults.map((product: any) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:border-teal-500 transition-colors">
                          <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.title}
                                width={150}
                                height={150}
                                className="w-full h-full object-cover rounded-lg"
                                unoptimized
                              />
                            ) : (
                              <div className="text-gray-400">No Image</div>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{product.title}</h4>
                          <p className="text-teal-600 font-semibold">${product.price}</p>
                          <p className="text-sm text-gray-600 mt-1">Stock: {product.stock}</p>
                          <button className="w-full mt-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
                            Contact Seller
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {b2bSearching && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Searching...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
