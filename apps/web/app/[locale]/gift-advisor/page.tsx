'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

const WELCOME = "Salom! Men Giftbot 🤖\nSizga eng yaxshi sovg'ani topishda yordam beraman.\nKim uchun sovg'a izlayapsiz?";

const QUICK_REPLIES = [
  { label: "Onam uchun 💐", value: "Onam uchun sovg'a izlayapman" },
  { label: "Rafiqam uchun ❤️", value: "Rafiqam uchun sovg'a izlayapman" },
  { label: "Do'stim uchun 🎁", value: "Do'stim uchun sovg'a izlayapman" },
  { label: "O'zim uchun ✨", value: "O'zim uchun narsa izlayapman" },
];

const RELATIONSHIP_MESSAGES: Record<string, string> = {
  'qiz-dost': "Qiz do'stim uchun sovg'a izlayapman",
  yigit: "Yigitim uchun sovg'a izlayapman",
  ona: "Onam uchun sovg'a izlayapman",
  ota: "Otam uchun sovg'a izlayapman",
  dost: "Do'stim uchun sovg'a izlayapman",
  oqituvchi: "O'qituvchim uchun sovg'a izlayapman",
};

interface ProductMini {
  id: string;
  nameUz: string;
  nameRu: string;
  price: number;
  slug: string;
  images: string[];
}

interface Message {
  id: string;
  role: 'bot' | 'user';
  content: string;
  streaming?: boolean;
  products?: ProductMini[];
}

async function fetchRelatedProducts(query: string): Promise<ProductMini[]> {
  try {
    const res = await fetch(
      `${API}/products/semantic-search?q=${encodeURIComponent(query)}&limit=3`,
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []).slice(0, 3);
  } catch {
    return [];
  }
}

function TypingDots() {
  return (
    <span className="flex gap-1 py-0.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

export default function GiftAdvisorPage() {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'bot', content: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('giftbot-session');
    const id = stored ?? crypto.randomUUID();
    if (!stored) localStorage.setItem('giftbot-session', id);
    setSessionId(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming || !sessionId) return;

      setShowQuickReplies(false);
      setInput('');
      setStreaming(true);

      const botMsgId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', content: trimmed },
        { id: botMsgId, role: 'bot', content: '', streaming: true },
      ]);

      try {
        const res = await fetch(`${API}/ai/gift-advisor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, sessionId }),
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let botContent = '';
        let gotDone = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6)) as {
                token?: string;
                done?: boolean;
                error?: string;
              };

              if (data.token) {
                botContent += data.token;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId ? { ...m, content: botContent } : m,
                  ),
                );
              }
              if (data.done) gotDone = true;
              if (data.error) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? { ...m, content: "Xatolik yuz berdi. Qayta urinib ko'ring.", streaming: false }
                      : m,
                  ),
                );
                return;
              }
            } catch {
              /* ignore malformed JSON in stream */
            }
          }
        }

        if (gotDone) {
          const products = await fetchRelatedProducts(trimmed);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? { ...m, streaming: false, products: products.length ? products : undefined }
                : m,
            ),
          );
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, streaming: false } : m)),
          );
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content: "Ulanishda xatolik. Iltimos, internet aloqasini tekshiring.",
                  streaming: false,
                }
              : m,
          ),
        );
      } finally {
        setStreaming(false);
        inputRef.current?.focus();
      }
    },
    [streaming, sessionId],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const searchParams = useSearchParams();
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (!sessionId || autoSentRef.current) return;
    const forParam = searchParams.get('for');
    if (!forParam) return;

    autoSentRef.current = true;
    const message = RELATIONSHIP_MESSAGES[forParam] ?? `${forParam} uchun sovg'a izlayapman`;
    sendMessage(message);
  }, [sessionId, searchParams, sendMessage]);

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: '100dvh' }}>
      {/* ── Header ── */}
      <header
        className="flex h-14 flex-shrink-0 items-center gap-3 px-4 text-white"
        style={{ backgroundColor: '#7C3AED' }}
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-xl">
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-none">Giftbot</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/80">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
            Online
          </p>
        </div>
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 transition-colors"
          aria-label="Yopish"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          {messages.map((msg, i) =>
            msg.role === 'bot' ? (
              <div key={msg.id} className="flex items-start gap-2 max-w-[85%]">
                {/* Avatar */}
                <div
                  className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-base"
                  style={{ backgroundColor: '#EDE9FE' }}
                >
                  🤖
                </div>

                <div>
                  {/* Bubble */}
                  <div className="rounded-xl rounded-tl-sm bg-white p-3 text-sm text-gray-800 shadow-sm leading-relaxed whitespace-pre-line">
                    {msg.content ? (
                      <>
                        {msg.content}
                        {msg.streaming && (
                          <span
                            className="ml-0.5 inline-block h-4 w-0.5 align-middle"
                            style={{ backgroundColor: '#7C3AED', animation: 'pulse 1s infinite' }}
                          />
                        )}
                      </>
                    ) : msg.streaming ? (
                      <TypingDots />
                    ) : null}
                  </div>

                  {/* Quick-reply chips — only on welcome message */}
                  {i === 0 && showQuickReplies && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {QUICK_REPLIES.map((qr) => (
                        <button
                          key={qr.label}
                          onClick={() => sendMessage(qr.value)}
                          className="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-brand-bg"
                          style={{ borderColor: '#7C3AED', color: '#7C3AED' }}
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Product mini cards */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {msg.products.map((p) => (
                        <Link
                          key={p.id}
                          href={`/product/${p.slug}`}
                          className="w-28 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="relative aspect-square bg-gray-50">
                            <Image
                              src={p.images[0] ?? '/placeholder.webp'}
                              alt={p.nameUz}
                              fill
                              sizes="112px"
                              className="object-cover"
                            />
                          </div>
                          <div className="p-2">
                            <p className="line-clamp-2 text-xs leading-snug text-gray-700 mb-1">
                              {p.nameUz}
                            </p>
                            <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>
                              {p.price.toLocaleString('uz-UZ')} so&apos;m
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex justify-end">
                <div
                  className="max-w-[85%] rounded-xl rounded-tr-sm p-3 text-sm leading-relaxed text-white"
                  style={{ backgroundColor: '#7C3AED' }}
                >
                  {msg.content}
                </div>
              </div>
            ),
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-shrink-0 items-center gap-2 border-t border-gray-200 bg-white px-4 py-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={streaming ? 'Javob kutilmoqda...' : 'Xabar yozing...'}
          disabled={streaming}
          className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: '#7C3AED' }}
          aria-label="Yuborish"
        >
          {/* Send arrow */}
          <svg className="h-5 w-5 translate-x-px" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
