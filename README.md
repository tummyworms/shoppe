# Designer's Shoppe

A simple inventory / showroom site. Browse pieces by category; every item links to
**Message on Facebook** (no phone number on the site). Inventory is managed from a
private, phone-friendly `/add` page.

## Run it locally

```bash
npm install      # first time only
npm run dev
```

Then open **http://localhost:3000**.

- **Public site:** `/`
- **Manage / upload:** `/add` (password from `.env.local`, default `shoppe`)

## Adding inventory (the /add page)

Made for a phone. Save `yoursite.com/add` to the home screen and it opens like an app.
Tap the photo box → take a photo or pick from the library → title → category → optional
note → **Publish**. The manage list below lets you **Mark sold / available** or **Delete**.

## Things to set before launch

1. **Logo** — drop the real logo file in as `public/logo.png`. It replaces the text
   wordmark automatically.
2. **Facebook Page** — in `lib/config.ts`, set `facebookPage` to the business Page's
   username (e.g. `facebook.com/DesignersShoppe` → `"DesignersShoppe"`). This powers every
   "Message on Facebook" button via `m.me/<username>`.
3. **Password** — change `ADMIN_PASSWORD` in `.env.local` to something private.
4. **Categories** — edit the `categories` list in `lib/config.ts` anytime.

## How it's built

- **Next.js (App Router)** + Tailwind.
- Inventory currently lives in `data/items.json`; photos in `public/uploads/`.
  This is the **local/pre-launch** setup so everything works with zero external accounts.
- At launch we swap `lib/store.ts` over to **Supabase** (database + photo storage) so it
  works on a real host (Vercel). Nothing else in the app needs to change — every page and
  the upload form only talk to the functions in `lib/store.ts`.
