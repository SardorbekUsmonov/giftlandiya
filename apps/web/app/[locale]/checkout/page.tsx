'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/stores/cart';
import api from '@/lib/api';

const DISTRICTS = [
  'Bektemir', 'Chilonzor', "Mirzo Ulug'bek", 'Mirobod',
  'Olmosoy', 'Sergeli', 'Uchtepa', 'Yakkasaroy', 'Yunusobod', 'Shayxontohur',
  "Yangiyo'l", 'Qibray', 'Zangiota', "Bo'ka", 'Toshkent shahri (boshqa)',
];

type PaymentMethod = 'PAYME' | 'CLICK' | 'UZUM' | 'CASH';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; color: string }[] = [
  { id: 'PAYME',  label: 'Payme',          icon: '💜', color: '#7C3AED' },
  { id: 'CLICK',  label: 'Click',          icon: '🔵', color: '#1D4ED8' },
  { id: 'UZUM',   label: 'Uzum Nasiya',    icon: '🟢', color: '#10B981' },
  { id: 'CASH',   label: "Naqd to'lov",   icon: '💵', color: '#6B7280' },
];

const DELIVERY_FEE = 15000;
const FREE_DELIVERY_THRESHOLD = 50000;

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const clear = useCartStore((s) => s.clear);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [form, setForm] = useState({
    contactName: '',
    contactPhone: '+998',
    address: '',
    district: '',
    notes: '',
    isGift: false,
    giftMessage: '',
    giftWrapping: false,
    secretSender: false,
    paymentMethod: 'PAYME' as PaymentMethod,
  });

  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const subtotal = mounted ? total() : 0;
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const giftWrapFee = form.isGift && form.giftWrapping ? 5000 : 0;
  const orderTotal = subtotal - (promo?.discount ?? 0) + delivery + giftWrapFee;

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await api.post('/promo-codes/validate', {
        code: promoInput.trim().toUpperCase(),
        subtotal,
      });
      const { code, discount } = res.data.data;
      setPromo({ code, discount });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPromoError(msg ?? 'Promo kod topilmadi');
    } finally {
      setPromoLoading(false);
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.contactName.trim()) e.contactName = 'Ism kiritilmadi';
    if (!form.contactPhone.match(/^\+998\d{9}$/)) e.contactPhone = "To'g'ri format: +998XXXXXXXXX";
    if (!form.address.trim()) e.address = 'Manzil kiritilmadi';
    if (!form.district) e.district = 'Tuman tanlanmadi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        items: items.map((i) => ({ productId: i.id, qty: i.qty })),
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        address: form.address,
        district: form.district,
        notes: form.notes || undefined,
        isGift: form.isGift,
        giftMessage: form.giftMessage || undefined,
        giftWrapping: form.giftWrapping,
        secretSender: form.secretSender,
        paymentMethod: form.paymentMethod,
        deliveryType: 'COURIER',
        promoCode: promo?.code,
        coinsUsed: 0,
      });
      const { orderNumber, paymentUrl } = res.data.data;
      clear();
      if (paymentUrl && form.paymentMethod !== 'CASH') {
        window.location.href = paymentUrl;
      } else {
        router.push(`/checkout/success?order=${orderNumber}`);
      }
    } catch {
      setErrors({ submit: "Buyurtma berishda xatolik. Iltimos, qayta urinib ko'ring." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="text-5xl">🛒</div>
        <p className="text-xl font-semibold text-gray-800">Savat bo&apos;sh</p>
        <button
          onClick={() => router.push('/')}
          className="rounded-xl px-6 py-3 text-white font-semibold"
          style={{ backgroundColor: '#7C3AED' }}
        >
          Xarid qilishni boshlash
        </button>
      </main>
    );
  }

  const inputCls = (key: string) =>
    `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
      errors[key]
        ? 'border-red-400 bg-red-50 focus:border-red-500'
        : 'border-gray-200 focus:border-brand bg-white'
    }`;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-6 text-xl font-medium text-gray-900">Buyurtma rasmiylashtirish</h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* ─── LEFT FORM ─── */}
          <div className="space-y-4">
            {/* Cart summary */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-gray-700">
                Buyurtmadagi mahsulotlar ({items.length})
              </p>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={item.image}
                        alt={item.nameUz}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.nameUz}</p>
                      <p className="text-xs text-gray-500">{item.qty} dona</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      {(item.price * item.qty).toLocaleString('uz-UZ')} so&apos;m
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer info */}
            <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
              <p className="text-sm font-semibold text-gray-700">Buyurtmachi ma&apos;lumotlari</p>

              <div>
                <input
                  type="text"
                  placeholder="Ism Familiya *"
                  value={form.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                  className={inputCls('contactName')}
                />
                {errors.contactName && <p className="mt-1 text-xs text-red-500">{errors.contactName}</p>}
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="+998XXXXXXXXX *"
                  value={form.contactPhone}
                  onChange={(e) => set('contactPhone', e.target.value)}
                  className={inputCls('contactPhone')}
                />
                {errors.contactPhone && <p className="mt-1 text-xs text-red-500">{errors.contactPhone}</p>}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Ko'cha, uy, xonadon raqami *"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  className={inputCls('address')}
                />
                {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
              </div>

              <div>
                <select
                  value={form.district}
                  onChange={(e) => set('district', e.target.value)}
                  className={inputCls('district') + ' cursor-pointer'}
                >
                  <option value="">Tuman tanlang *</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.district && <p className="mt-1 text-xs text-red-500">{errors.district}</p>}
              </div>

              <textarea
                placeholder="Qo'shimcha izoh (ixtiyoriy)"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand resize-none"
              />
            </div>

            {/* Gift section */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <label className="flex cursor-pointer items-center gap-3">
                <div
                  className={`relative h-6 w-10 rounded-full transition-colors ${
                    form.isGift ? 'bg-brand' : 'bg-gray-200'
                  }`}
                  onClick={() => set('isGift', !form.isGift)}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      form.isGift ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-800">🎁 Sovg&apos;a sifatida yuborish</span>
              </label>

              {form.isGift && (
                <div className="mt-3 space-y-3">
                  <textarea
                    placeholder="Sovg'a xabari (otkritka matni)"
                    value={form.giftMessage}
                    onChange={(e) => set('giftMessage', e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand resize-none"
                  />
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.giftWrapping}
                      onChange={(e) => set('giftWrapping', e.target.checked)}
                      className="accent-brand"
                    />
                    <span>Sovg&apos;a o&apos;rash <span className="text-gray-400">(+5,000 so&apos;m)</span></span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.secretSender}
                      onChange={(e) => set('secretSender', e.target.checked)}
                      className="accent-brand"
                    />
                    <span>🤫 Yashirin yuboruvchi</span>
                  </label>
                </div>
              )}
            </div>

            {/* Payment methods */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-gray-700">To&apos;lov usuli</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(({ id, label, icon, color }) => {
                  const active = form.paymentMethod === id;
                  return (
                    <button
                      key={id}
                      onClick={() => set('paymentMethod', id)}
                      className="flex items-center gap-2 rounded-xl border-2 p-3 text-left transition-all"
                      style={
                        active
                          ? { borderColor: color, backgroundColor: `${color}10` }
                          : { borderColor: '#E5E7EB', backgroundColor: 'white' }
                      }
                    >
                      <span className="text-xl">{icon}</span>
                      <span className={`text-sm font-medium ${active ? '' : 'text-gray-700'}`}
                            style={active ? { color } : {}}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Promo code */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-gray-700">Promo kod</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="PROMO KOD"
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm uppercase outline-none focus:border-brand tracking-wider"
                  disabled={!!promo}
                />
                {promo ? (
                  <button
                    onClick={() => { setPromo(null); setPromoInput(''); }}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Bekor
                  </button>
                ) : (
                  <button
                    onClick={applyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: '#7C3AED' }}
                  >
                    {promoLoading ? '...' : "Qo'llash"}
                  </button>
                )}
              </div>
              {promo && (
                <p className="mt-1.5 text-sm text-green-600">
                  ✓ -{promo.discount.toLocaleString('uz-UZ')} so&apos;m chegirma qo&apos;llandi
                </p>
              )}
              {promoError && <p className="mt-1.5 text-sm text-red-500">{promoError}</p>}
            </div>

            {/* Submit error */}
            {errors.submit && (
              <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {errors.submit}
              </p>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl py-4 text-lg font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#F59E0B', color: '#1C0A00' }}
            >
              {submitting ? 'Yuborilmoqda...' : 'Buyurtma berish'}
            </button>
          </div>

          {/* ─── RIGHT SUMMARY ─── */}
          <div className="lg:sticky lg:top-4 h-fit">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="mb-4 font-semibold text-gray-900">Buyurtma xulosasi</p>

              {/* Items */}
              <div className="mb-4 space-y-3 max-h-56 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image src={item.image} alt={item.nameUz} fill className="object-cover" />
                    </div>
                    <p className="flex-1 text-xs text-gray-700 line-clamp-2">{item.nameUz}</p>
                    <span className="flex-shrink-0 text-xs font-semibold text-gray-900">
                      {(item.price * item.qty).toLocaleString('uz-UZ')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Jami ({items.reduce((s, i) => s + i.qty, 0)} dona)</span>
                  <span>{subtotal.toLocaleString('uz-UZ')} so&apos;m</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Yetkazib berish</span>
                  {delivery === 0 ? (
                    <span className="text-green-600 font-medium">Bepul</span>
                  ) : (
                    <span>{delivery.toLocaleString('uz-UZ')} so&apos;m</span>
                  )}
                </div>

                {giftWrapFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Sovg&apos;a o&apos;rash</span>
                    <span>{giftWrapFee.toLocaleString('uz-UZ')} so&apos;m</span>
                  </div>
                )}

                {promo && (
                  <div className="flex justify-between text-green-600">
                    <span>Chegirma ({promo.code})</span>
                    <span>-{promo.discount.toLocaleString('uz-UZ')} so&apos;m</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <span className="font-semibold text-gray-900">Umumiy</span>
                  <span className="text-lg font-bold" style={{ color: '#F59E0B' }}>
                    {Math.max(0, orderTotal).toLocaleString('uz-UZ')} so&apos;m
                  </span>
                </div>
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
                <span>🔒</span>
                <span>SSL himoyalangan to&apos;lov</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
