# Voxara Phase 1

AI influencer analytics SaaS built with Next.js 14, TypeScript, Supabase, Prisma, and Tailwind CSS.

## 1) Clone and install

```bash
git clone <your-repo-url>
cd Voxara
npm install
```

## 2) Create a Supabase project

1. Create a project in the [Supabase Dashboard](https://supabase.com/dashboard)
2. Copy the project URL and anon key into `.env.local`

## 3) Run Supabase migration

```bash
supabase db push
```

This applies `supabase/migrations/001_rls.sql` and enables RLS policies.

## 4) Configure OAuth apps

Create and configure apps for each platform:

- YouTube (Google Cloud): [Google Cloud Console](https://console.cloud.google.com/)
- TikTok: [TikTok for Developers](https://developers.tiktok.com/)
- Instagram: [Meta for Developers](https://developers.facebook.com/)

Add redirect URLs exactly as defined in `.env.example`.

## 5) Configure environment variables

```bash
cp .env.example .env.local
cp .env.example .env
```

Populate all values in **both** `.env.local` (Next.js) and `.env` (Prisma CLI).

`DATABASE_URL` should be your Supabase Postgres connection string from **Project Settings → Database**.

## 6) Run Prisma migration

```bash
npx prisma generate
npx prisma migrate dev
```

## 7) Run local development

```bash
npm run dev
```

## 8) Deploy to Vercel

1. Import the repository into [Vercel](https://vercel.com/)
2. Add all environment variables from `.env.example`
3. Deploy with build command:

```bash
prisma generate && next build
```
