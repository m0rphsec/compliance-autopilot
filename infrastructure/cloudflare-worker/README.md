# License Validation API - Cloudflare Worker

This Cloudflare Worker handles license validation for Compliance Autopilot.

## Setup Instructions

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create KV Namespace

```bash
wrangler kv namespace create LICENSES
```

Copy the returned ID and update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "LICENSES"
id = "paste-your-id-here"
```

### 4. Deploy the Worker

```bash
cd infrastructure/cloudflare-worker
wrangler deploy
```

You'll get a URL like: `https://compliance-autopilot-license.taylsec.workers.dev`

### 5. Update the Action

Update the license validation endpoint in `src/licensing/validator.ts`:
```typescript
const DEFAULT_LICENSE_API = 'https://compliance-autopilot-license.taylsec.workers.dev/validate';
```

### 6. Configure Stripe Webhook

In Stripe Dashboard (https://dashboard.stripe.com/webhooks):
1. Click **Add destination**
2. Select events from **my account**
3. Add these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Destination type: **Webhook endpoint**
5. Set endpoint URL: `https://compliance-autopilot-license.taylsec.workers.dev/webhook/stripe`
6. After creation, reveal the **Signing secret** (`whsec_...`)

### 7. Add Secrets

```bash
# Admin token for manual license management
openssl rand -hex 32
wrangler secret put ADMIN_TOKEN

# Stripe webhook signing secret
wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 8. Update Price Mapping

Edit `worker.js` and update the `mapPriceToTier` function with your actual Stripe Price IDs:

```javascript
const tierMap = {
  'price_xxx': 'starter',    // Starter monthly
  'price_xxx': 'starter',    // Starter yearly
  'price_xxx': 'pro',        // Pro monthly
  'price_xxx': 'pro',        // Pro yearly
  'price_xxx': 'enterprise', // Enterprise monthly
  'price_xxx': 'enterprise', // Enterprise yearly
};
```

## Custom Domain (Optional)

To use `compliance-autopilot-license.taylsec.workers.dev`:

1. Add domain to Cloudflare
2. Add a route in `wrangler.toml`
3. Redeploy

## Testing

Test the health endpoint:
```bash
curl https://compliance-autopilot-license.taylsec.workers.dev/health
```

Test license validation:
```bash
curl https://compliance-autopilot-license.taylsec.workers.dev/validate?key=test-key
```

## Admin Endpoints

Create a license manually:
```bash
curl -X POST "https://compliance-autopilot-license.taylsec.workers.dev/admin/license?admin_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"TEST-PRO-001","tier":"pro"}'
```

Look up a license:
```bash
curl "https://compliance-autopilot-license.taylsec.workers.dev/admin/license?admin_token=YOUR_TOKEN&key=TEST-PRO-001"
```
