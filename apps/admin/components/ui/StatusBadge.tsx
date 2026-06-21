const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  NEW:         { label: 'Yangi',       bg: '#F3F4F6', text: '#374151' },
  CONFIRMED:   { label: 'Tasdiqlandi', bg: '#DBEAFE', text: '#1D4ED8' },
  PACKING:     { label: 'Qadoqlanmoqda', bg: '#FEF9C3', text: '#92400E' },
  READY:       { label: 'Tayyor',      bg: '#EDE9FE', text: '#5B21B6' },
  ON_COURIER:  { label: 'Kuryerda',    bg: '#FFEDD5', text: '#C2410C' },
  DELIVERED:   { label: 'Yetkazildi',  bg: '#D1FAE5', text: '#065F46' },
  CANCELLED:   { label: 'Bekor',       bg: '#FEE2E2', text: '#991B1B' },
  RETURNED:    { label: 'Qaytarildi',  bg: '#FEE2E2', text: '#991B1B' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: '#F3F4F6', text: '#374151' };
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}
