# JOSIXLOGS — Setup Guide

## Stack
- **Frontend & Backend**: Next.js 14 (App Router)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Payments**: Flutterwave (primary), PayPal, Crypto, Bank transfer
- **Hosting**: Vercel
- **Styling**: Tailwind CSS + Syne + Space Grotesk fonts

---

## 1. Supabase Setup

1. Go to supabase.com → New project
2. Open SQL Editor → paste the entire contents of `supabase/schema.sql` → Run
3. Go to Project Settings → API → copy your URL, anon key, and service role key

---

## 2. Environment Variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=your_flw_public_key
FLUTTERWAVE_SECRET_KEY=your_flw_secret_key
FLUTTERWAVE_SECRET_HASH=your_webhook_hash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ADMIN_ACCESS_KEY=JOSIXLOGS-ADMIN-2024
```

---

## 3. Create Your Admin Account

1. Register at /register
2. In Supabase Table Editor → profiles → set your role to "admin"
3. Log in at /admin-login (NOT /login) — requires email, password, AND admin access key

---

## 4. Key Routes

| Route | Purpose |
|-------|---------|
| / | Homepage |
| /store | Product store |
| /login | User login |
| /register | Registration |
| /dashboard | User dashboard |
| /dashboard/wallet | Wallet + topup |
| /dashboard/orders | Order history |
| /admin-login | Admin-only login (hidden from users) |
| /admin | Admin overview |
| /admin/listings | Manage listings |
| /admin/listings/new | Add listing + bulk upload |
| /admin/categories | Categories & services |
| /admin/orders | All orders |
| /admin/users | Users & wallets |
| /admin/settings | Site settings |

---

## 5. Adding Products

1. /admin/categories → add Category → add Service
2. /admin/listings/new → create Listing (service + country + price)
3. Paste items in Bulk add box → goes live instantly

---

## 6. Run & Deploy

```bash
npm install
npm run dev        # local
vercel             # deploy
```
