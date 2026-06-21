const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  NEW:         { label: 'Yangi',          bg: '#1F2937', text: '#9CA3AF' },
  CONFIRMED:   { label: 'Tasdiqlandi',    bg: '#1E3A5F', text: '#60A5FA' },
  PACKING:     { label: 'Qadoqlanmoqda', bg: '#2D1F00', text: '#FCD34D' },
  READY:       { label: 'Tayyor',         bg: '#2E1065', text: '#A78BFA' },
  ON_COURIER:  { label: 'Kuryerda',       bg: '#2D1500', text: '#FB923C' },
  DELIVERED:   { label: 'Yetkazildi',     bg: '#052E16', text: '#34D399' },
  CANCELLED:   { label: 'Bekor',          bg: '#2D0A0A', text: '#F87171' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: '#1F2937', text: '#9CA3AF' };
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}
