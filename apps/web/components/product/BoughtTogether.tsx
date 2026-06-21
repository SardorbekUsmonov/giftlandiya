import ProductCard from '@/components/shop/ProductCard';

interface BoughtItem {
  productId: string;
  nameUz: string;
  nameRu: string;
  price: number;
  comparePrice?: number;
  slug: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
}

async function fetchBoughtTogether(productId: string): Promise<BoughtItem[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/bought-together`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function BoughtTogether({ productId }: { productId: string }) {
  const items = await fetchBoughtTogether(productId);
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-bold text-gray-900">Birga olinadi</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item) => (
          <ProductCard
            key={item.productId}
            id={item.productId}
            nameUz={item.nameUz}
            nameRu={item.nameRu}
            price={item.price}
            comparePrice={item.comparePrice}
            images={item.images}
            slug={item.slug}
            rating={item.rating ?? 0}
            reviewCount={item.reviewCount ?? 0}
            stock={item.stock ?? 0}
          />
        ))}
      </div>
    </section>
  );
}
