import Link from 'next/link';
import Badge from '@/components/ui/badge';

interface SellerCardProps {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  isVerified: boolean;
  joinedDate: string;
}

export default function SellerCard({
  id,
  name,
  slug,
  logo,
  description,
  rating,
  reviewCount,
  productCount,
  isVerified,
  joinedDate,
}: SellerCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
          {logo ? (
            <img src={logo} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
              {name.charAt(0)}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link 
              href={`/store/${slug}`}
              className="font-semibold text-gray-900 hover:text-hipa-primary"
            >
              {name}
            </Link>
            {isVerified && (
              <Badge variant="primary" size="sm">Verified</Badge>
            )}
          </div>
          
          {description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
          )}
          
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {rating.toFixed(1)}
            </span>
            <span>({reviewCount} reviews)</span>
            <span>{productCount} products</span>
          </div>
        </div>
      </div>
    </div>
  );
}
