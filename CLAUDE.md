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
| State | Zustand with persist middleware (`store/cart.js`, `store/wishlist.js`) |
| Images | Cloudinary (`lib/cloudinary.js`) |
| Payments | Razorpay (not yet built) |
| Styling | Tailwind v4 + shadcn/ui + FreshMart design tokens |
| Notifications | react-hot-toast |
| Icons | lucide-react |

## Key Conventions

### Data Fetching
- Server Components fetch directly with `prisma` — no API routes for page data
- API routes (`app/api/`) exist only for client-triggered mutations (cart sync, orders, etc.)
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

**Middleware** (`middleware.js`): `clerkMiddleware` handles both `/admin/*` and customer protected routes. Also gates onboarding: signed-out `/` → `/welcome`, signed-in `/welcome` → `/`

### Dynamic Imports
- `ssr: false` is NOT allowed in Server Components (Next.js 16 restriction)
- Use `<Suspense>` boundary instead for client components that use `useSearchParams()`
- `NavSearch` uses `dynamic(ssr:false)` because it lives inside the Navbar (a client component)

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

## App Structure (Route Groups)
```
app/
  layout.jsx              ← root: bare html/body + globals.css only
  global-error.jsx        ← root catch-all error boundary
  (customer)/             ← customer-facing app (Navbar, BottomNav, FreshMart theme)
    layout.jsx            ← Navbar + Toaster + fm-paper background
    error.jsx
    not-found.jsx
    page.jsx, products/, cart/, checkout/, login/, register/
  admin/                  ← internal admin portal (URL prefix /admin/*)
    layout.jsx            ← admin shell (sidebar TBD)
    login/, dashboard/, products/, orders/, …
  api/                    ← shared API routes (mutations only)
```

## Pages Built (Customer App)
| Route | File | Notes |
|---|---|---|
| `/` | `app/(customer)/page.jsx` | Server Component, PromoBanners + CategoryCards (horizontal category cards with product counts) |
| `/products` | `app/(customer)/products/page.jsx` | Server Component, search/filter/sort + ProductCard grid |
| `/cart` | `app/(customer)/cart/page.jsx` | Client Component, Zustand cart, qty stepper, order summary, free delivery nudge |
| `/checkout` | `app/(customer)/checkout/page.jsx` | Client Component, delivery form + pincode validation, coupon, Razorpay payment |
| `/login` | `app/(customer)/login/page.jsx` | Clerk `<SignIn>`, `returnTo` redirect, `LoginForm` wrapped in `<Suspense>` for useSearchParams |
| `/register` | `app/(customer)/register/page.jsx` | Clerk `<SignUp>` |
| `/admin/login` | `app/admin/login/[[...rest]]/page.jsx` | Clerk `<SignIn>` with FreshMart styling, `signUpUrl` disabled |
| `/welcome` | `app/welcome/page.jsx` | Onboarding carousel for signed-out users; lives outside `(customer)` group (no Navbar). Middleware redirects signed-out `/` → `/welcome` and signed-in `/welcome` → `/` |

## Components Built
| Component | Type | Purpose |
|---|---|---|
| `Navbar` | Client | Top nav, Clerk auth state, cart badge |
| `NavSearch` | Client | Search input, isolated for useSearchParams |
| `BottomNav` | Client | Mobile bottom navigation |
| `PromoBanners` | Server | Static promo banners on home page |
| `CategoryCards` | Client | Home page category section: motion stagger-in, horizontal scroll cards (product image or emoji + item count) |
| `CategoryFilter` | Server | Horizontal pill links for category filtering |
| `SortSelect` | Client | Sort dropdown (wrap in `<Suspense>` when used in Server Component) |
| `ProductCard` | Client | Product tile with add-to-cart stepper + wishlist toggle |
| `WelcomeScreen` | Client | Onboarding screen: 3-slide carousel (auto-advance, swipe, dots), Log in / Sign up CTAs |
| `welcome/illustrations` | Presentational | Inline SVG slide illustrations (basket, delivery, freshness) in fm palette |

## Cart Store (`store/cart.js`)
`addToCart({ productId, variantId, name, price, unit, imageUrl, stockQty })`
`updateQuantity(id, qty)` · `removeItem(id)` · `clearCart()`
`totalAmount()` · `totalItems()`

## Wishlist Store (`store/wishlist.js`)
`toggle(productId)` · `isWishlisted(productId)` · `clear()`

## API Helpers (`lib/api-error.js`)
`apiResponse(data, status?)` · `apiError(message, status?)`

## Environment Variables
```
DATABASE_URL=                       # pooler (port 6543) — used at runtime
DIRECT_URL=                         # direct (port 5432) — used for migrations only
NEXT_PUBLIC_SUPABASE_URL=           # still needed for DB hosting (not for auth)
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # still needed for DB hosting (not for auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

## Database Models
User · Category · Product · ProductVariant · Order · OrderItem · Payment · CartItem · Wishlist · DeliveryAgent · Coupon · DeliveryArea · Setting

## Still To Build
- `/orders/[id]` — Order confirmation / tracking page (needed for post-checkout redirect)
- `/products/[id]` — Product detail page
- `/orders`, `/orders/[id]` — Order history + tracking
- `/settings` — User profile settings
- `/wishlist` — Wishlist page
- Remaining admin pages — coupons, delivery agents, areas

## Notes
- `middleware.js` deprecation warning ("use proxy instead") — safe to ignore for now, it still works
- Supabase `rls_auto_enable()` function and `ensure_rls` event trigger were dropped (security fix)
- `package.json` has `"type": "module"` — all config files must use ESM
