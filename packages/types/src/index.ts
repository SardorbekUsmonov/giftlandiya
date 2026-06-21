// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface IUser {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  birthday?: string;
  gender?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SELLER' | 'WAREHOUSE' | 'CUSTOMER';
  loyaltyCoins: number;
  ltv: number;
  segment: 'NEW' | 'ACTIVE' | 'VIP' | 'SLEEPING';
  telegramId?: string;
  referralCode: string;
  createdAt: string;
}

export interface IAddress {
  id: string;
  userId: string;
  title: string;
  address: string;
  district: string;
  landmark?: string;
  isDefault: boolean;
}

export interface IGiftCalendar {
  id: string;
  userId: string;
  personName: string;
  eventType: string;
  eventDate: string;
  budget?: number;
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export interface ICategory {
  id: string;
  nameUz: string;
  nameRu: string;
  slug: string;
  image?: string;
  parentId?: string;
  sortOrder: number;
  children?: ICategory[];
  productCount?: number;
}

export interface IProduct {
  id: string;
  sku: string;
  nameUz: string;
  nameRu: string;
  descUz: string;
  descRu?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  reserved: number;
  images: string[];
  videoUrl?: string;
  model3dUrl?: string;
  tags: string[];
  occasions: string[];
  forWhom: string[];
  rating: number;
  reviewCount: number;
  slug: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  category?: ICategory;
  createdAt: string;
}

export interface IReview {
  id: string;
  productId: string;
  userId: string;
  user?: Pick<IUser, 'name'>;
  rating: number;
  comment?: string;
  images: string[];
  isApproved: boolean;
  createdAt: string;
}

// ─── Cart (client-side only, not persisted in DB) ─────────────────────────────

export interface ICartItem {
  productId: string;
  slug: string;
  nameUz: string;
  nameRu: string;
  price: number;
  image: string;
  qty: number;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PACKING'
  | 'READY'
  | 'ON_COURIER'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED';

export type PaymentMethod = 'PAYME' | 'CLICK' | 'UZUM' | 'CASH';

export type DeliveryType = 'COURIER' | 'PICKUP' | 'SCHEDULED' | 'SECRET';

export interface IOrderItem {
  id: string;
  productId: string;
  product?: Pick<IProduct, 'nameUz' | 'nameRu' | 'images' | 'slug'>;
  qty: number;
  price: number;
}

export interface IOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  userId?: string;
  sellerId?: string;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  promoCode?: string;
  coinsUsed: number;
  address: string;
  district?: string;
  contactName: string;
  contactPhone: string;
  isGift: boolean;
  giftMessage?: string;
  giftWrapping: boolean;
  secretSender: boolean;
  deliveryType: DeliveryType;
  scheduledAt?: string;
  notes?: string;
  utmSource?: string;
  payment?: IPayment;
  createdAt: string;
}

export interface IPayment {
  id: string;
  orderId: string;
  provider: PaymentMethod;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  paidAt?: string;
}

// ─── Sellers ──────────────────────────────────────────────────────────────────

export interface ISeller {
  id: string;
  userId: string;
  shopName?: string;
  description?: string;
  monthlyTarget: number;
  commissionRate: number;
  isActive: boolean;
  user?: Pick<IUser, 'id' | 'name' | 'phone' | 'email'>;
}

export interface ISellerStats {
  todaySales: number;
  todayOrders: number;
  monthlySales: number;
  monthlyOrders: number;
  monthlyTarget: number;
  targetPercent: number;
  rank: number;
  totalSellers: number;
}

// ─── Promo Codes ──────────────────────────────────────────────────────────────

export interface IPromoCode {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface IPromoValidation {
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  discount: number;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface IGiftAdvisorChunk {
  token?: string;
  done?: boolean;
  error?: string;
}

export interface ISemanticSearchResult extends Pick<IProduct, 'id' | 'nameUz' | 'nameRu' | 'price' | 'slug' | 'images'> {
  similarity: number;
}

// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiError {
  error: {
    code: number;
    message: string;
    details?: unknown;
  };
}
