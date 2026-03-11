This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Upload compression (Sharp + TinyPNG CLI)

Admin panel image uploads are handled by `src/app/api/upload/route.ts`.

Current flow:
1. Validate extension + magic bytes + MIME.
2. Re-encode with `sharp` (sanitization + baseline compression).
3. Optionally run `tinypng-cli` for additional JPG/PNG optimization.

### Environment variables

Add these to your `.env.local`:

```bash
# Existing behavior (default true)
UPLOAD_FORCE_REENCODE=true

# TinyPNG integration toggle
UPLOAD_ENABLE_TINYPNG=true

# TinyPNG API key (from https://tinypng.com/developers)
TINYPNG_API_KEY=your_real_api_key_here
```

Notes:
- If TinyPNG is disabled or key is missing, upload still works with Sharp compression.
- TinyPNG step is applied to `.jpg/.jpeg/.png` uploads.
- `.webp` is kept on Sharp-only path for compatibility.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
