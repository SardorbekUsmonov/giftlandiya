import SectionHeader from '@/components/ui/SectionHeader';
import ProductGridAnimated from './ProductGridAnimated';

interface Product {
  id: string;
  nameUz: string;
  nameRu: string;
  price: number;
  comparePrice?: number;
  images: string[];
  slug: string;
  rating: number;
  reviewCount: number;
  stock: number;
  createdAt: string;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

async function fetchNewProducts(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?sort=newest&limit=6&isActive=true`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function NewProductsSection() {
  const products = await fetchNewProducts();
  if (products.length === 0) return null;

  const now = Date.now();
  const mapped = products.map((p) => ({
    ...p,
    isNew: new Date(p.createdAt).getTime() > now - SEVEN_DAYS,
  }));

  return (
    <section>
      <SectionHeader
        title="Yangi mahsulotlar"
        subtitle="Eng so'nggi qo'shilgan mahsulotlar"
        link="/catalog?sort=newest"
        linkText="Barchasini ko'rish"
      />
      <ProductGridAnimated products={mapped} />
    </section>
  );
}
