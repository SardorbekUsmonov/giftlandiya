'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Category { id: string; nameUz: string }

interface ProductData {
  nameUz: string;
  nameRu: string;
  descriptionUz: string;
  descriptionRu: string;
  price: string;
  comparePrice: string;
  sku: string;
  stock: string;
  categoryId: string;
  images: string[];
  isActive: boolean;
  isGiftable: boolean;
  tags: string;
}

const EMPTY: ProductData = {
  nameUz: '', nameRu: '', descriptionUz: '', descriptionRu: '',
  price: '', comparePrice: '', sku: '', stock: '', categoryId: '',
  images: [], isActive: true, isGiftable: true, tags: '',
};

interface Props {
  productId?: string;
  initialData?: Partial<ProductData>;
  categories: Category[];
}

export default function ProductForm({ productId, initialData, categories }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProductData>({ ...EMPTY, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(productId);

  const set = (k: keyof ProductData, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const uploadFiles = useCallback(async (files: File[]) => {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const r = await api.post('/admin/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        urls.push(r.data.data.url);
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch {
      setError('Rasmni yuklashda xato');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length) uploadFiles(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) uploadFiles(files);
    e.target.value = '';
  };

  const removeImage = (url: string) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((u) => u !== url) }));

  const generateDescription = async () => {
    if (!form.nameUz) { setError('Avval mahsulot nomini kiriting'); return; }
    setGeneratingAI(true);
    setError('');
    try {
      const r = await api.post('/admin/ai/generate-description', {
        nameUz: form.nameUz,
        nameRu: form.nameRu,
        categoryId: form.categoryId,
        tags: form.tags,
      });
      const { descriptionUz, descriptionRu } = r.data.data;
      setForm((prev) => ({ ...prev, descriptionUz, descriptionRu }));
    } catch {
      setError('AI tavsif yaratishda xato');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        nameUz: form.nameUz,
        nameRu: form.nameRu,
        descriptionUz: form.descriptionUz,
        descriptionRu: form.descriptionRu,
        price: parseInt(form.price, 10),
        comparePrice: form.comparePrice ? parseInt(form.comparePrice, 10) : undefined,
        sku: form.sku || undefined,
        stock: parseInt(form.stock, 10),
        categoryId: form.categoryId || undefined,
        images: form.images,
        isActive: form.isActive,
        isGiftable: form.isGiftable,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      if (isEdit) {
        await api.patch(`/admin/products/${productId}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }
      router.push('/products');
      router.refresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Xato yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Left column */}
      <div className="space-y-5">
        {/* Names */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Mahsulot nomi</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              O&apos;zbekcha nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.nameUz}
              onChange={(e) => set('nameUz', e.target.value)}
              placeholder="Masalan: Atirgul buket"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Ruscha nom</label>
            <input
              type="text"
              value={form.nameRu}
              onChange={(e) => set('nameRu', e.target.value)}
              placeholder="Например: Букет роз"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        {/* Descriptions */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Tavsif</h2>
            <button
              type="button"
              onClick={generateDescription}
              disabled={generatingAI}
              className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-60"
            >
              {generatingAI ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                  Yozilmoqda...
                </>
              ) : (
                <>✨ AI tavsif yoz</>
              )}
            </button>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">O&apos;zbekcha</label>
            <textarea
              rows={4}
              value={form.descriptionUz}
              onChange={(e) => set('descriptionUz', e.target.value)}
              placeholder="Mahsulot haqida batafsil..."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Ruscha</label>
            <textarea
              rows={4}
              value={form.descriptionRu}
              onChange={(e) => set('descriptionRu', e.target.value)}
              placeholder="Подробное описание..."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        {/* Images */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-900">Rasmlar</h2>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              dragOver ? 'border-brand bg-purple-50' : 'border-gray-200 hover:border-brand hover:bg-gray-50'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                <p className="text-sm text-gray-500">Yuklanmoqda...</p>
              </div>
            ) : (
              <>
                <p className="text-2xl mb-1">🖼️</p>
                <p className="text-sm font-medium text-gray-700">Rasmlarni bu yerga tashlang</p>
                <p className="text-xs text-gray-400">yoki bosing • WebP, PNG, JPG</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Uploaded images */}
          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.images.map((url) => (
                <div key={url} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Teglar (vergul bilan)</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="sovg'a, gul, bayram, yubiley"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-5">
        {/* Pricing */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Narx</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Narx (tiyinda) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min={0}
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="150000"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-14 text-sm outline-none focus:border-brand transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">so&apos;m</span>
            </div>
            {form.price && (
              <p className="mt-1 text-xs text-gray-400">
                = {parseInt(form.price || '0').toLocaleString('uz-UZ')} so&apos;m
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Eski narx (chegirma uchun)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                value={form.comparePrice}
                onChange={(e) => set('comparePrice', e.target.value)}
                placeholder="200000"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-14 text-sm outline-none focus:border-brand transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">so&apos;m</span>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Ombor</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => set('sku', e.target.value)}
              placeholder="GLF-001"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Stok (dona) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              placeholder="100"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        {/* Category & settings */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Sozlamalar</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Kategoriya</label>
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors"
            >
              <option value="">Kategoriya tanlang</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameUz}</option>
              ))}
            </select>
          </div>

          {/* Toggles */}
          {[
            { key: 'isActive' as const, label: 'Faol (saytda ko\'rinadigan)' },
            { key: 'isGiftable' as const, label: 'Sovg\'a sifatida yuborish mumkin' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{label}</span>
              <button
                type="button"
                onClick={() => set(key, !form[key])}
                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                style={{ backgroundColor: form[key] ? '#7C3AED' : '#D1D5DB' }}
              >
                <span
                  className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                  style={{ transform: form[key] ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
          ))}
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
          style={{ backgroundColor: '#7C3AED' }}
        >
          {saving ? 'Saqlanmoqda...' : isEdit ? 'Saqlash' : 'Mahsulot qo\'shish'}
        </button>
      </div>
    </form>
  );
}
