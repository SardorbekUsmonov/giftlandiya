'use client';

import { motion } from 'framer-motion';
import ProductCard from '@/components/shop/ProductCard';

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
  isNew: boolean;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show:  { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ProductGridAnimated({ products }: { products: Product[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-50px' }}
      className="grid grid-cols-2 gap-4 md:grid-cols-3"
    >
      {products.map((p) => (
        <motion.div key={p.id} variants={item}>
          <ProductCard
            id={p.id}
            nameUz={p.nameUz}
            nameRu={p.nameRu}
            price={p.price}
            comparePrice={p.comparePrice}
            images={p.images}
            slug={p.slug}
            rating={p.rating}
            reviewCount={p.reviewCount}
            stock={p.stock}
            isNew={p.isNew}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
