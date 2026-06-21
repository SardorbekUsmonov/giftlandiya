export interface SellerUser {
  id: string;
  shopName?: string;
  user?: { name?: string; phone: string };
}

export function getAuth(): { accessToken: string; seller: SellerUser } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('seller-auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(accessToken: string, seller: SellerUser) {
  localStorage.setItem('seller-auth', JSON.stringify({ accessToken, seller }));
  document.cookie = `seller-token=${accessToken}; path=/; max-age=86400; samesite=lax`;
}

export function clearAuth() {
  localStorage.removeItem('seller-auth');
  document.cookie = 'seller-token=; max-age=0; path=/';
}
