'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

interface Category {
  id: string;
  nameUz: string;
  nameRu: string;
  slug: string;
  image?: string;
  sortOrder: number;
  parentId?: string;
  productCount: number;
  children?: Category[];
}

interface FormState {
  nameUz: string;
  nameRu: string;
  slug: string;
  parentId: string;
  image: string;
  sortOrder: string;
}

const EMPTY_FORM: FormState = {
  nameUz: '', nameRu: '', slug: '', parentId: '', image: '', sortOrder: '0',
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}

// ── Category form modal ──────────────────────────────────────────────────────
function CategoryModal({
  initial,
  editId,
  topLevel,
  onClose,
  onSaved,
}: {
  initial?: Partial<FormState>;
  editId?: string;
  topLevel: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormState, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('image', r.data.data.url);
    } catch { setError('Rasm yuklashda xato'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      nameUz: form.nameUz,
      nameRu: form.nameRu,
      slug: form.slug || slugify(form.nameUz),
      parentId: form.parentId || undefined,
      image: form.image || undefined,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
    };
    try {
      if (editId) {
        await api.patch(`/admin/categories/${editId}`, payload);
      } else {
        await api.post('/admin/categories', payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Xato yuz berdi');
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {editId ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">O&apos;zbekcha nom *</label>
              <input
                required value={form.nameUz}
                onChange={(e) => { set('nameUz', e.target.value); set('slug', slugify(e.target.value)); }}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Ruscha nom *</label>
              <input
                required value={form.nameRu}
                onChange={(e) => set('nameRu', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm outline-none focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Ota-kategoriya</label>
              <select
                value={form.parentId}
                onChange={(e) => set('parentId', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="">— Top level —</option>
                {topLevel.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameUz}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Tartib raqami</label>
              <input
                type="number" min={0} value={form.sortOrder}
                onChange={(e) => set('sortOrder', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Rasm</label>
            <div className="flex items-center gap-2">
              {form.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="" className="h-10 w-10 rounded-xl object-cover" />
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:border-brand hover:text-brand disabled:opacity-50"
              >
                {uploading ? 'Yuklanmoqda...' : '📎 Rasm yuklash'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#7C3AED' }}
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Category row ─────────────────────────────────────────────────────────────
function CategoryRow({
  cat,
  depth,
  topLevel,
  onEdit,
  onDelete,
  onRefresh,
}: {
  cat: Category;
  depth: number;
  topLevel: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = cat.children && cat.children.length > 0;

  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            {/* Drag handle */}
            <span className="cursor-grab text-gray-300 hover:text-gray-400" title="Tartib o'zgartirish">
              ⠿
            </span>
            {/* Expand toggle */}
            {hasChildren ? (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:text-gray-700 transition-transform"
                style={{ transform: expanded ? 'rotate(90deg)' : undefined }}
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ) : (
              <span className="w-5" />
            )}
            {/* Image */}
            {cat.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cat.image} alt={cat.nameUz} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm" style={{ backgroundColor: '#EDE9FE' }}>
                📁
              </div>
            )}
            <span className={depth === 0 ? 'font-semibold text-gray-900' : 'text-sm text-gray-700'}>
              {cat.nameUz}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">{cat.nameRu}</td>
        <td className="px-4 py-3 font-mono text-xs text-gray-400">{cat.slug}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{cat.productCount}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(cat)}
              className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-brand hover:text-brand transition-colors"
            >
              Tahrir
            </button>
            <div className="group relative">
              <button
                onClick={() => cat.productCount === 0 && onDelete(cat)}
                disabled={cat.productCount > 0}
                className="rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed"
                style={cat.productCount > 0
                  ? { borderColor: '#FCA5A5', color: '#FCA5A5' }
                  : { borderColor: '#FCA5A5', color: '#EF4444' }
                }
              >
                O&apos;chir
              </button>
              {cat.productCount > 0 && (
                <div className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                  Mahsulotlar bor
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
      {expanded && cat.children?.map((child) => (
        <CategoryRow
          key={child.id}
          cat={child}
          depth={depth + 1}
          topLevel={topLevel}
          onEdit={onEdit}
          onDelete={onDelete}
          onRefresh={onRefresh}
        />
      ))}
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTree = useCallback(() => {
    setLoading(true);
    api.get('/admin/categories')
      .then((r) => setTree(r.data.data ?? r.data ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  const topLevel = tree; // only parent categories in dropdown

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/categories/${deleteTarget.id}`);
      fetchTree();
      setDeleteTarget(null);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Xato');
    } finally { setDeleting(false); }
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          Kategoriyalar <span className="font-normal text-gray-400 text-base">({tree.length})</span>
        </h1>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#7C3AED' }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Yangi kategoriya
        </button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
              {['Nomi', 'Ruscha', 'Slug', 'Mahsulotlar', 'Amallar'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : tree.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">Kategoriya yo&apos;q</td>
              </tr>
            ) : (
              tree.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  depth={0}
                  topLevel={topLevel}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  onRefresh={fetchTree}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <CategoryModal
          editId={editTarget?.id}
          initial={editTarget ? {
            nameUz: editTarget.nameUz,
            nameRu: editTarget.nameRu,
            slug: editTarget.slug,
            parentId: editTarget.parentId ?? '',
            image: editTarget.image ?? '',
            sortOrder: String(editTarget.sortOrder),
          } : undefined}
          topLevel={topLevel}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={fetchTree}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 font-semibold text-gray-900">Kategoriyani o&apos;chirish</h3>
            <p className="mb-4 text-sm text-gray-500">
              <strong>{deleteTarget.nameUz}</strong> ni o&apos;chirishni tasdiqlaysizmi?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-700">
                Bekor
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? '...' : "O'chirish"}
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
