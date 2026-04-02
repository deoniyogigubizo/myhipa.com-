import Link from 'next/link';
import Badge from '@/components/ui/badge';

interface StoreHeaderProps {
  name: string;
  slug: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  isVerified: boolean;
  location?: string;
}

export default function StoreHeader({
  name,
  slug,
  logo,
  coverImage,
  description,
  rating,
  reviewCount,
  productCount,
  isVerified,
  location,
}: StoreHeaderProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-r from-hipa-primary to-hipa-secondary">
        {coverImage && (
          <img src={coverImage} alt={name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Store Info */}
      <div className="px-6 pb-6">
        <div className="flex items-end gap-4 -mt-12">
          <div className="w-24 h-24 rounded-xl bg-white shadow-lg overflow-hidden">
            {logo ? (
              <img src={logo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-hipa-primary">
                {name.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="flex-1 mb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              {isVerified && (
                <Badge variant="primary">Verified Seller</Badge>
              )}
            </div>
            {location && (
              <p className="text-gray-500 text-sm mt-1">{location}</p>
            )}
          </div>
          
          <div className="flex gap-2 mb-2">
            <Link
              href={`/store/${slug}`}
              className="px-4 py-2 bg-hipa-primary text-white rounded-lg font-medium hover:bg-hipa-secondary transition-colors"
            >
              Visit Store
            </Link>
          </div>
        </div>

        {description && (
          <p className="text-gray-600 mt-4">{description}</p>
        )}

        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-1">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-semibold">{rating.toFixed(1)}</span>
            <span className="text-gray-500">({reviewCount} reviews)</span>
          </div>
          <div className="text-gray-500">
            <span className="font-semibold">{productCount}</span> products
          </div>
        </div>
      </div>
    </div>
  );
}
