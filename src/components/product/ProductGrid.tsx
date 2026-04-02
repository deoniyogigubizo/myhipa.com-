'use client';

import ProductCard from '@/components/product/ProductCard';

interface Product {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  sellerName?: string;
  sellerSlug?: string;
  isVerified?: boolean;
  stock?: number;
  slug: string;
}

interface ProductGridProps {
  products: Product[];
  title?: string;
  showBlackBackground?: boolean; // Controls black bg for product grid
}

export default function ProductGrid({
  products,
  title,
  showBlackBackground = false,
}: ProductGridProps) {
  return (
    <section className={`py-8 ${showBlackBackground ? 'product-grid-black' : 'bg-beige-global'}`}>
      <div className="container mx-auto px-4">
        {title && (
          <h2 className={`text-2xl font-bold mb-6 ${showBlackBackground ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h2>
        )}
        
        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              price={product.price}
              compareAtPrice={product.compareAtPrice ?? undefined}
              image={product.image}
              rating={product.rating ?? 0}
              reviewCount={product.reviewCount ?? 0}
              sellerName={product.sellerName ?? undefined}
              sellerSlug={product.sellerSlug ?? undefined}
              isVerified={product.isVerified ?? false}
              stock={product.stock ?? 0}
              slug={product.slug}
              // Featured products (first 2) get black background in black grid mode
              isFeatured={showBlackBackground && index < 2}
            />
          ))}
        </div>
        
        {products.length === 0 && (
          <p className={`text-center py-8 ${showBlackBackground ? 'text-gray-400' : 'text-gray-500'}`}>
            No products found.
          </p>
        )}
      </div>
    </section>
  );
}
