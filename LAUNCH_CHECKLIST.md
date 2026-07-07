# Launch Checklist (theootd.brand)

Use this checklist before merging `codex/next-task` into `main` and going live.

## 1. Pre-Merge Quality Gate

- [ ] Working tree is clean: `git status`
- [ ] Tests pass: `npm test`
- [ ] Lint passes (warnings reviewed): `npm run lint`
- [ ] Production build passes: `npm run build`
- [ ] Latest commits reviewed: `git log --oneline --decorate -n 20`

## 2. Environment Variables (Production)

Set all required env vars in your deployment platform:

- [ ] `MONGODB_URI`
- [ ] `NEXTAUTH_URL` (your production URL)
- [ ] `NEXTAUTH_SECRET`
- [ ] `AUTH_SECRET` (same exact value as `NEXTAUTH_SECRET`)
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `PAYSTACK_SECRET_KEY`
- [ ] `PAYSTACK_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `EMAIL_FROM`
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`
- [ ] `ADMIN_EMAIL`
- [ ] `ADMIN_PASSWORD`
- [ ] `CUSTOM_ORDER_DEPOSIT_GHS` (optional, defaults to `150`)
- [ ] `NEXT_PUBLIC_CUSTOM_ORDER_DEPOSIT_GHS` (optional display value)

## 3. OAuth & Auth Hardening

- [ ] Google OAuth redirect URI added:
  - `https://<your-domain>/api/auth/callback/google`
- [ ] `NEXTAUTH_SECRET` and `AUTH_SECRET` are identical.
- [ ] After first deploy with new auth cookie version, users sign in again once.

## 4. Paystack Configuration

- [ ] Webhook URL set in Paystack dashboard:
  - `https://<your-domain>/api/webhooks/paystack`
- [ ] Webhook secret matches `PAYSTACK_WEBHOOK_SECRET`.
- [ ] Callback domain is allowed in Paystack.
- [ ] Live mode keys are used in production.

## 5. Database & Indexes

- [ ] MongoDB cluster is reachable from deployment runtime.
- [ ] Unique/indexed fields are healthy:
  - `Product.slug` (unique)
  - `Product.variants.sku` (unique in variant docs)
  - `Order.paymentReference` (unique)
  - `PaymentEvent.eventKey` (unique)
  - `CustomOrder.paymentReference` (unique)
- [ ] Admin account can log in.

## 6. Functional Smoke Tests

- [ ] Customer sign up/login works (credentials + Google).
- [ ] Admin login works.
- [ ] Admin can create/edit/delete products.
- [ ] Cart and checkout flow works.
- [ ] Paystack payment success updates order to `Success`.
- [ ] Failed/invalid payment updates order to `Failed`.
- [ ] Webhook replay is idempotent (no duplicate processing).
- [ ] Custom order flow works:
  - delivery details captured
  - reference image upload works
  - payment initializes
  - status reconciles from verify/webhook

## 7. Merge Prep

- [ ] Confirm branch diff from main:
  - `git log --oneline main..codex/next-task`
- [ ] Merge into main:
  - `git checkout main`
  - `git merge --no-ff codex/next-task`
- [ ] Final verification on main:
  - `npm test && npm run build`
- [ ] Push main:
  - `git push origin main`

## 8. Post-Deploy Checks

- [ ] Visit `/` and `/products` on production.
- [ ] Place one real test order with Paystack.
- [ ] Verify order status in `/orders` and admin views.
- [ ] Check server logs for auth/session errors.
- [ ] Check webhook events are being recorded.
