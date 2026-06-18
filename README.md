# Tide E-commerce MVP

Next.js 16 App Router storefront + admin with MongoDB, Auth.js role guards, and Paystack payment/webhook integration.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Environment

Copy `.env.example` to `.env` and fill values:

- `MONGODB_URI`
- `MONGODB_DIRECT_URI` (optional fallback if SRV DNS lookup fails locally)
- `MONGODB_DB_NAME` (optional)
- `NEXTAUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `GOOGLE_CLIENT_ID` (for Google sign-in)
- `GOOGLE_CLIENT_SECRET` (for Google sign-in)
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_WEBHOOK_SECRET` (or fallback to secret key)
- `NEXT_PUBLIC_APP_URL`
- `STORE_DISCOUNT_CODES` (optional JSON array of active coupon rules)
- `EMAIL_FROM` (e.g. `"Tide <no-reply@yourdomain.com>"`)
- `SMTP_HOST`
- `SMTP_PORT` (usually `587` or `465`)
- `SMTP_USER`
- `SMTP_PASS`

For local Google OAuth, add this redirect URI in Google Cloud Console:

```text
http://localhost:3000/api/auth/callback/google
```

## Payment/Webhook Endpoints

- Checkout init: `POST /api/checkout/init`
- Transaction verify: `POST /api/paystack/verify`
- Paystack webhook: `POST /api/webhooks/paystack`

Set your Paystack dashboard webhook URL to:

```text
https://your-domain.com/api/webhooks/paystack
```

Coupon rules use a JSON array in `STORE_DISCOUNT_CODES`, for example:

```json
[
  { "code": "TIDE10", "type": "percentage", "value": 10 },
  { "code": "WELCOME500", "type": "fixed", "value": 500, "minimumSubtotal": 5000 }
]
```

## Notes

- Admin routes (`/admin/*`) are protected by `proxy.ts` and server-side auth checks.
- Order statuses are `Pending`, `Success`, `Failed` and are reconciled idempotently by reference.
- If `mongodb+srv://` DNS resolution is blocked on your network, set `MONGODB_DIRECT_URI` to the standard Atlas `mongodb://host1:27017,host2:27017,...` string and the app will use it before the SRV URI.
