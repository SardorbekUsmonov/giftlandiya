# Giftlandiya — E-commerce Platform

## Project Overview
Online gift, home decor and souvenir store for Uzbekistan market.
Website: giftlandiya.uz
Stack: Next.js 15 + NestJS + TypeScript

## Languages
- UI text: Uzbek (uz) PRIMARY + Russian (ru) SECONDARY
- All code, variable names, comments: English only
- i18n library: next-intl
- Translation files: /messages/uz.json and /messages/ru.json
- API language switching: Accept-Language header (uz or ru)

## Tech Stack
Frontend (3 portals, all Next.js 15):
  - apps/web    → giftlandiya.uz (customer store)
  - apps/admin  → admin.giftlandiya.uz (admin panel)
  - apps/seller → seller.giftlandiya.uz (seller PWA, mobile-first)

Backend:
  - apps/api    → api.giftlandiya.uz (NestJS + Fastify)

Packages (shared):
  - packages/types → shared TypeScript interfaces
  - packages/ui    → shared React components

Dependencies:
  Frontend: Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Zustand, React Query, next-intl
  Backend: NestJS, TypeScript, Fastify, Prisma, ioredis, BullMQ, class-validator
  Database: PostgreSQL 16 + pgvector extension, Prisma ORM
  Cache: Redis 7 + BullMQ
  Search: Meilisearch
  Storage: Cloudflare R2 (images always as WebP, max 1200px wide)
  AI: Claude API (claude-sonnet-4-6) + OpenAI (text-embedding-3-small)

## Brand Colors — NEVER change, NEVER use other colors
Primary brand:    #7C3AED   Vibrant Purple
Secondary:        #A78BFA   Soft Lavender
CTA Buy button:   #F59E0B   Warm Gold  ← ONLY gold for "Sotib olish" / buy now
Add to cart btn:  #7C3AED   Purple background
Success:          #10B981   Green
Error:            #EF4444   Red
Warning:          #F59E0B   Amber
Info:             #3B82F6   Blue
Telegram button:  #229ED9   Telegram brand blue

Dark mode:
  Page bg:    #0F1117
  Card bg:    #181C25
  Elevated:   #1E2433
  Border:     #2A3040
  Text 1st:   #F8FAFC
  Text 2nd:   #CBD5E1
  Text muted: #64748B

Hero gradient: linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #C084FC 100%)

## Strict Rules — ALWAYS follow, NO exceptions
1.  Money stored as INTEGER tiyins: 150000 = 150,000 so'm (no decimals, no floats)
2.  Display money: {price.toLocaleString('uz-UZ')} so'm
3.  All API routes prefixed: /api/v1/
4.  Customer auth: phone number + SMS OTP only (NO password)
5.  Admin auth: email + password (bcrypt)
6.  Seller auth: phone + password (bcrypt)
7.  Images: always use next/image, always WebP format
8.  App Router ONLY — use app/ directory, NO pages/ directory
9.  Server Components by default — add 'use client' only when truly needed
10. "Sotib olish" (buy) button: ALWAYS #F59E0B gold background, dark text #1C0A00
11. "Savatga" (cart) button: ALWAYS #7C3AED purple background, white text
12. All DTOs: use class-validator decorators
13. All DB queries: Prisma only (raw SQL only for pgvector operations)
14. API response format: { data: T, meta?: { total, page, limit, pages } }
15. Never expose passwords, tokens, or API keys in responses
16. Uzbek phone format: +998XXXXXXXXX (12 chars total)
17. Order number format: "GL" + year + 6-digit sequential (e.g. GL2026000001)

## File Naming Conventions
React components:  PascalCase  → ProductCard.tsx, NavBar.tsx
React hooks:       camelCase   → useCart.ts, useAuth.ts
NestJS modules:    kebab-case  → gift-advisor.module.ts
NestJS services:   kebab-case  → auth.service.ts
i18n keys:         dot.notation → product.addToCart, nav.catalog

## Environment Variables Required
Backend (apps/api/.env):
  DATABASE_URL, REDIS_URL, MEILISEARCH_HOST, MEILISEARCH_KEY
  JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN
  ANTHROPIC_API_KEY, OPENAI_API_KEY
  PAYME_MERCHANT_ID, PAYME_SECRET
  CLICK_SERVICE_ID, CLICK_MERCHANT_USER_ID, CLICK_SECRET
  ESKIZ_EMAIL, ESKIZ_PASSWORD
  TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID
  R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_PUBLIC_URL
  FRONTEND_URL, ADMIN_URL, SELLER_URL
  NODE_ENV, PORT

Frontend (apps/web/.env.local):
  NEXT_PUBLIC_API_URL
  NEXT_PUBLIC_POSTHOG_KEY (optional analytics)