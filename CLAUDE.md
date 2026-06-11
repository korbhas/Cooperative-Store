@AGENTS.md

# FreshMart — Project Reference

## What this is
A grocery e-commerce app (Next.js 16 App Router, plain JS) replicating github.com/korbhas/grocery-store. All database access is server-side via Prisma — no Supabase client-side REST calls to the database.

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.6 — App Router, plain JS (no TypeScript) |
| Database | Supabase (hosted Postgres) |
| ORM | Prisma 7 with `prisma-client-js` + `@prisma/adapter-pg` (PrismaPg) |
| Auth | **Both customer + admin:** Clerk (`@clerk/nextjs`) |
| State | Zustand with persist middleware (`store/cart.js`, `store/wishlist.js`, `store/checkout.js`) |
| Images | Cloudinary (`lib/cloudinary.js`) |
| Payments | Razorpay — checkout, verification (`/api/orders/verify`), webhook (`/api/webhooks/razorpay`) |
| Styling | Tailwind v4 + shadcn/ui (base-nova style) + FreshMart design tokens |
| Notifications | react-hot-toast |
| Icons | @tabler/icons-react (lucide-react is NOT installed) |
| Monitoring | Sentry (`@sentry/nextjs`) |

## Key Conventions

### Data Fetching
- Server Components fetch directly with `prisma` — no API routes for page data
- API routes (`app/api/`) exist only for client-triggered mutations (orders, coupon validation, admin CRUD, webhooks)
- `searchParams` in page.jsx is a **Promise** — always `await searchParams`
- Prisma `Decimal` and `Date` fields are not serializable across the Server→Client boundary. Always serialize before passing to Client Components: `price.toNumber()`, `createdAt.toISOString()`

### Auth
**Customer (Clerk):**
- Browser: `useUser()`, `useClerk()`, `useSignIn()`, `useSignUp()` from `@clerk/nextjs`
- Server/API routes: `auth()` (userId only), `currentUser()` (full profile) from `@clerk/nextjs/server`
- Clerk owns credentials — Prisma `User` record is upserted by email on first order

**Admin (Clerk):**
- Server/API routes: same `auth()` + `currentUser()` from `@clerk/nextjs/server`
- Admin role check: `user.publicMetadata?.role === 'admin'` (set in Clerk dashboard → User → Public Metadata)
- Guard helper: `lib/admin-guard.js` → `requireAdmin()` for API routes
- Protected layout: `app/admin/(protected)/layout.jsx` redirects non-admins to `/`

**Middleware** (`middleware.js`): `clerkMiddleware` protects `/admin/*` and customer routes (`/settings`, `/wishlist`, `/checkout`). Signed-in users hitting `/welcome` are redirected to `/`; the first-visit welcome overlay for signed-out users is handled on the home page via cookie (`WelcomeOverlay`), not by middleware redirect.

### shadcn/ui (base-nova style)
- `components.json`: `tsx: false` — the CLI generates plain `.jsx`
- Two primitive families coexist: Base UI components (sheet, dropdown-menu, navigation-menu…) use the **`render` prop** (`render={<Link href… />}`); vaul/embla-based ones (drawer, carousel) use **`asChild`**
- The CLI emits `lucide-react` imports (components.json `iconLibrary`) but lucide is not installed — **swap icon imports to `@tabler/icons-react`** after every `shadcn add` (aliasing works: `import { IconChevronLeft as ChevronLeftIcon } from '@tabler/icons-react'`)
- When users paste registry blocks: adapt to plain JS + project conventions instead of installing verbatim; only `shadcn add` missing base primitives

### Dynamic Imports
- `ssr: false` is NOT allowed in Server Components (Next.js 16 restriction)
- Use `<Suspense>` boundary instead for client components that use `useSearchParams()`

### Prisma
- Config in `prisma.config.js` (not schema.prisma) — uses `DIRECT_URL` for migrations
- Runtime uses `DATABASE_URL` (pooler) via `PrismaPg` adapter with SSL
- Generated client at `lib/generated/prisma`
- Import: `import { prisma } from '@/lib/prisma'`

### Design Tokens (all `var(--color-fm-*)`)
```
--color-fm-green: #1f4d34       (primary brand green)
--color-fm-green-soft: #e6efe6  (green backgrounds)
--color-fm-green-ink: #2a6a47   (green text/borders)
--color-fm-accent: #d3893a      (orange accent)
--color-fm-accent-soft: #fbeed8
--color-fm-paper: #fafaf6       (page background)
--color-fm-paper2: #f1f1ea      (card/nav background)
--color-fm-ink: #1f2520         (primary text)
--color-fm-ink2: #4a544c        (secondary text)
--color-fm-ink3: #8a948c        (muted text)
--color-fm-line-soft: rgba(31,37,32,0.18)
--font-sans / --font-heading: 'Okra', Helvetica
--font-mono: 'JetBrains Mono'
```
- shadcn semantic tokens (`--background`, `--border`, …) in `app/globals.css` map FreshMart colors and **must hold complete color values** (hex/rgba/oklch). Raw HSL triplets break Tailwind v4 — borders fall back to `currentColor` (near-black)
- Radius scale derives from `--radius: 0.375rem` (slight rounding everywhere; `rounded-xl` = ×1.4). `ProductCard` overrides locally with `[--radius:0.875rem]`

## App Structure (Route Groups)
```
app/
  layout.jsx              ← root: bare html/body + globals.css only
  global-error.jsx        ← root catch-all error boundary
  (customer)/             ← customer app (Navbar, Footer, FreshMart theme)
    layout.jsx            ← Navbar + Footer + Toaster, flex column fill
    page.jsx              ← home: HeroCarousel + CategoryCards (+ WelcomeOverlay via cookie)
    products/, products/[id]/
    checkout/address/, checkout/payment/
    login/, register/
  welcome/                ← standalone onboarding carousel (outside customer chrome)
  admin/                  ← admin portal: login/ + (protected)/{dashboard,products,orders,…}
  api/                    ← orders (POST create, GET history), orders/verify, coupons/validate,
                            delivery/check, products/categories, webhooks/razorpay, admin/*
```

**No `/cart`, `/orders`, or `/settings` pages** — cart, order history/details, and settings are all drawers (see below). After payment, `usePlaceOrder` shows a success toast and redirects to `/`.

## Drawers & Sheets (primary UX pattern)
| Component | Side | Purpose |
|---|---|---|
| `CartDrawer` | right | Full cart + **in-drawer checkout**: cart → address → payment (Razorpay). Signed-out checkout redirects to `/login?returnTo=/checkout/address`. Closes itself before the Razorpay modal opens (`usePlaceOrder({ onExit })`) |
| `OrdersDrawer` | right | Order history (fetches `GET /api/orders` on open): list of orders → per-order detail view with status timeline (expanded), items, totals, `AddressCard` |
| `MenuDrawer` | left | Mobile nav: nested Products→categories section, Orders, Settings, phone, auth |
| `SettingsDrawer` | left | Account (Clerk `openUserProfile()`) + default delivery details (`AddressForm` → checkout store) + sign out. No `/settings` page |

Page-based checkout (`/checkout/address` → `/checkout/payment`) still exists and shares the same logic as the drawer flow.

## Shared Checkout Logic
- `hooks/use-place-order.js` — `usePlaceOrder({ onExit })` → `{ placeOrder, submitting }`: order POST, stale-cart pruning, Razorpay load/open/verify, cart+checkout cleanup, redirect
- `components/checkout/AddressForm.jsx` — TanStack Form + Zod (name / 10-digit phone / address), saves to checkout store, restores saved values, Clerk name prefill. Pass unique `formId`; submit via external `<Button form={formId}>`
- `components/checkout/CouponField.jsx` — apply/remove against `/api/coupons/validate`, bound to checkout store

## Components
| Component | Type | Purpose |
|---|---|---|
| `Navbar` | Client | Sticky pill nav. Mobile: hamburger (MenuDrawer) left of logo. Right: orders icon (mobile) → phone (md+) → cart (CartDrawer) → avatar (all breakpoints, initials fallback, dropdown menu) |
| `Footer` | Server | FreshMart wordmark + Home/Products links + copyright |
| `HeroCarousel` | Server (embla client primitives) | Home hero: looping promo slides (flash sale / free delivery / new in), replaced PromoBanners |
| `CategoryCards` | Client | Home category section: motion stagger, horizontal scroll cards |
| `CategoryFilter` / `SortSelect` | Server / Client | Products page filtering (wrap SortSelect in `<Suspense>`) |
| `ProductCard` | Client | Product tile, add-to-cart stepper, wishlist toggle, local radius override |
| `AddressCard` | Server-safe | Read-only address display (icon rows: name/address/phone/email), used in OrdersDrawer |
| `OrderStatusTimeline` | Client | Collapsible status timeline (`defaultOpen`, `className` props) |
| `CheckoutSteps` | Client | Step indicator for page-based checkout |
| `PageLoader` | Client | Loading spinner block |
| `NavSearch` | Client | Search input (currently not mounted in Navbar) |
| `welcome/*` | Client | Onboarding overlay + slide illustrations |

## Stores (Zustand + persist)
- **`store/cart.js`** — `addToCart({productId, variantId, name, price, unit, imageUrl, stockQty}, qty)` · `updateQuantity(id, qty)` · `removeItem(id)` · `clearCart()` · `totalAmount()` · `totalItems()` (stock-capped)
- **`store/wishlist.js`** — `toggle(productId)` · `isWishlisted(productId)` · `clear()`
- **`store/checkout.js`** — `address` ({name, phone, address}) · `coupon` · `setAddress` · `setCoupon` · `clear()`. Shared by page checkout, drawer checkout, and SettingsDrawer ("default delivery details" are device-local; DB user phone is upserted at order time)

## Config (`lib/config.js`)
`DELIVERY_FEE = 40` · `FREE_DELIVERY_THRESHOLD = 499` · `RAZORPAY_CURRENCY = 'INR'` · `RAZORPAY_THEME_COLOR` · `CATEGORY_EMOJIS`

## API Helpers (`lib/api-error.js`)
`apiResponse(data, status?)` · `apiError(message, status?)` · `ApiError`

## Environment Variables
```
DATABASE_URL=                       # pooler (port 6543) — used at runtime
DIRECT_URL=                         # direct (port 5432) — used for migrations only
NEXT_PUBLIC_SUPABASE_URL=           # still needed for DB hosting (not for auth)
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # still needed for DB hosting (not for auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_ID=                    # via lib/env.js
RAZORPAY_KEY_SECRET=
```

## Database Models
User · Category · Product · ProductVariant · Order · OrderItem · Payment · CartItem · Wishlist · DeliveryAgent · Coupon · DeliveryArea · Setting

## Still To Build
- `/wishlist` — Wishlist page (store exists, route is middleware-protected)
- Remaining admin pages — coupons, delivery agents, areas (admin has dashboard, products, orders, categories, inventory, payments, promotions, revenue, settings, users)

## Notes
- `middleware.js` deprecation warning ("use proxy instead") — safe to ignore for now, it still works
- Supabase `rls_auto_enable()` function and `ensure_rls` event trigger were dropped (security fix)
- `package.json` has `"type": "module"` — all config files must use ESM
- Vercel deploys `main` on push — a broken build on main means production deploys fail
