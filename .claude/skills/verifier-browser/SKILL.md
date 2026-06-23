---
name: verifier-browser
description: Verifies browser-based features of the FreshMart grocery app by driving Playwright against the production URL (https://cooperative-store.vercel.app). Use when asked to test, verify, or do a test transaction on the live site — including checkout flows, Razorpay payment modal, cart interactions, login, and page rendering.
---

# Browser Verifier — FreshMart (cooperative-store.vercel.app)

## Setup

```bash
# Check Playwright is available
npx playwright --version

# Write and run a test script
node /tmp/pw-verify.mjs
```

## Workflow

1. Write a self-contained Playwright script to `/tmp/pw-verify.mjs`
2. Run it with `node /tmp/pw-verify.mjs`
3. Screenshots land in `/tmp/pw-screenshots/`
4. Report findings inline with screenshot paths

## Script template

```js
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const PROD = 'https://cooperative-store.vercel.app';
const SS = '/tmp/pw-screenshots';
mkdirSync(SS, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

// — steps —
await page.goto(PROD);
await page.screenshot({ path: `${SS}/01-home.png`, fullPage: false });

await browser.close();
console.log('done');
```

## Checkout / payment flow

```js
// 1. Add product to cart
await page.goto(`${PROD}/products`);
await page.locator('[data-testid="add-to-cart"]').first().click();

// 2. Open cart drawer and proceed
await page.locator('[aria-label="Cart"]').click();
await page.getByRole('button', { name: /checkout/i }).click();

// 3. Fill address form (if on address step)
await page.fill('[name="name"]', 'Test User');
await page.fill('[name="phone"]', '9876543210');
await page.fill('[name="address"]', '123 Test Street, Guwahati');
await page.getByRole('button', { name: /continue/i }).click();

// 4. Razorpay modal — wait for iframe
const rzpFrame = page.frameLocator('iframe[src*="razorpay"]');

// Card payment
await rzpFrame.locator('text=Card').click();
await rzpFrame.locator('[name="card[number]"]').fill('4111 1111 1111 1111');
await rzpFrame.locator('[name="card[expiry]"]').fill('12/26');
await rzpFrame.locator('[name="card[cvv]"]').fill('123');
await rzpFrame.getByRole('button', { name: /pay/i }).click();

// UPI payment (alternative)
// await rzpFrame.locator('text=UPI').click();
// await rzpFrame.locator('[name="vpa"]').fill('test@razorpay');
// await rzpFrame.getByRole('button', { name: /pay/i }).click();
```

## Auth (Clerk)

The site uses Clerk. If a flow requires sign-in, either:
- Use a pre-seeded test account by filling the Clerk sign-in modal
- Or navigate directly to `/login` and sign in before the flow

## Razorpay test credentials

| Method | Details |
|---|---|
| Card | 4111 1111 1111 1111 · CVV: 123 · Expiry: 12/26 |
| UPI | test@razorpay |

## Notes

- Razorpay modal opens in an iframe — use `page.frameLocator('iframe[src*="razorpay"]')`
- Modal may take 2–3 s to fully render; use `waitFor` or `locator().waitFor()`
- Screenshots are the primary evidence — capture before and after each key step
- The `NEXT_PUBLIC_RAZORPAY_KEY_ID` must be set on Vercel for the modal to open
