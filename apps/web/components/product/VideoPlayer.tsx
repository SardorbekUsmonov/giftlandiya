'use client';

import { useRef, useState, useCallback } from 'react';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play().then(() => setPlaying(true)).catch(() => null); }
  }, [playing]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = ref.current;
    if (!v || !duration) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - left) / width) * duration;
  };

  const toggleFs = () =>
    document.fullscreenElement
      ? document.exitFullscreen()
      : ref.current?.requestFullscreen();

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="relative flex h-full w-full flex-col" style={{ backgroundColor: '#0F1117' }}>
      <video
        ref={ref}
        src={src}
        className="flex-1 w-full object-contain cursor-pointer"
        onTimeUpdate={() => setCurrent(ref.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(ref.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
        muted={muted}
        playsInline
        onClick={toggle}
      />

      {/* Center play button (when paused) */}
      {!playing && (
        <button
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Ijro etish"
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
            style={{ backgroundColor: '#7C3AED' }}
          >
            <svg className="ml-1 h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </span>
        </button>
      )}

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-8">
        {/* Progress bar */}
        <div
          className="relative mb-2 h-1 cursor-pointer rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
          onClick={seek}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: '#7C3AED' }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow"
            style={{ left: `calc(${pct}% - 6px)` }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggle} className="text-white hover:opacity-80">
            {playing ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <span className="font-mono text-xs text-white/80">{fmt(current)} / {fmt(duration)}</span>

          <div className="flex-1" />

          <button
            onClick={() => { setMuted(!muted); if (ref.current) ref.current.muted = !muted; }}
            className="text-white hover:opacity-80"
            aria-label={muted ? 'Ses ochish' : 'Sesni o\'chirish'}
          >
            {muted ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          <button onClick={toggleFs} className="text-white hover:opacity-80" aria-label="To'liq ekran">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
