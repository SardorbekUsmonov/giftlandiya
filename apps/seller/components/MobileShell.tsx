import BottomNav from './BottomNav';

export default function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center" style={{ backgroundColor: '#0F1117' }}>
      <div className="relative flex w-full max-w-[480px] flex-col" style={{ minHeight: '100dvh' }}>
        <main className="flex-1 overflow-y-auto pb-20 pt-safe scrollbar-hide">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
