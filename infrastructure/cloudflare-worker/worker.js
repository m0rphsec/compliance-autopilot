/**
 * Compliance Autopilot License Validation Worker
 *
 * Deploy to Cloudflare Workers to validate license keys.
 * Uses Cloudflare KV for storing valid licenses.
 *
 * Stripe webhooks update the KV store when subscriptions are created/cancelled.
 */

// Stripe webhook events we care about
const STRIPE_EVENTS = {
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  CHECKOUT_COMPLETED: 'checkout.session.completed',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers for browser requests (if needed)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handling
    if (url.pathname === '/validate' && request.method === 'GET') {
      return handleValidate(url, env, corsHeaders);
    }

    if (url.pathname === '/webhook/stripe' && request.method === 'POST') {
      return handleStripeWebhook(request, env, corsHeaders);
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        provider: 'stripe'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin endpoint to manually add/check licenses (protected)
    if (url.pathname === '/admin/license' && request.method === 'GET') {
      return handleAdminGetLicense(url, env, corsHeaders);
    }

    if (url.pathname === '/admin/license' && request.method === 'POST') {
      return handleAdminSetLicense(request, env, corsHeaders);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};

/**
 * Validate a license key
 * GET /validate?key=xxx
 */
async function handleValidate(url, env, corsHeaders) {
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response(JSON.stringify({
      valid: false,
      tier: 'free',
      error: 'No license key provided'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Look up license in KV store
    const licenseData = await env.LICENSES.get(key, { type: 'json' });

    if (!licenseData) {
      return new Response(JSON.stringify({
        valid: false,
        tier: 'free',
        error: 'License key not found'
      }), {
        status: 200, // Return 200 with valid:false, not 404
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check expiration
    if (licenseData.expiresAt && new Date(licenseData.expiresAt) < new Date()) {
      return new Response(JSON.stringify({
        valid: false,
        tier: 'free',
        error: 'License has expired'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if cancelled
    if (licenseData.status === 'cancelled' || licenseData.status === 'canceled') {
      return new Response(JSON.stringify({
        valid: false,
        tier: 'free',
        error: 'License has been cancelled'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Valid license
    return new Response(JSON.stringify({
      valid: true,
      tier: licenseData.tier,
      expiresAt: licenseData.expiresAt,
      features: getTierFeatures(licenseData.tier),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('License validation error:', error);
    return new Response(JSON.stringify({
      valid: false,
      tier: 'free',
      error: 'Validation service error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Handle Stripe webhooks
 * POST /webhook/stripe
 *
 * Events:
 * - customer.subscription.created: Add license
 * - customer.subscription.updated: Update license tier
 * - customer.subscription.deleted: Mark as cancelled
 * - checkout.session.completed: Generate and store license key
 */
async function handleStripeWebhook(request, env, corsHeaders) {
  try {
    const signature = request.headers.get('Stripe-Signature');
    const body = await request.text();

    // Verify webhook signature
    if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing signature or webhook secret');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isValid = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      console.error('Invalid Stripe signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const event = JSON.parse(body);
    const eventType = event.type;

    console.log(`Stripe webhook: ${eventType}`);

    switch (eventType) {
      case STRIPE_EVENTS.CHECKOUT_COMPLETED:
        await handleCheckoutCompleted(event.data.object, env);
        break;

      case STRIPE_EVENTS.SUBSCRIPTION_CREATED:
      case STRIPE_EVENTS.SUBSCRIPTION_UPDATED:
        await handleSubscriptionUpdate(event.data.object, env);
        break;

      case STRIPE_EVENTS.SUBSCRIPTION_DELETED:
        await handleSubscriptionCancelled(event.data.object, env);
        break;

      default:
        console.log(`Unhandled event: ${eventType}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Verify Stripe webhook signature
 */
async function verifyStripeSignature(payload, signature, secret) {
  try {
    const parts = signature.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) {
      return false;
    }

    const timestamp = timestampPart.split('=')[1];
    const expectedSignature = signaturePart.split('=')[1];

    // Check timestamp is within 5 minutes
    const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp);
    if (timestampAge > 300) {
      console.error('Webhook timestamp too old');
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computedSignature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Handle checkout.session.completed event
 * This is where we generate the license key
 */
async function handleCheckoutCompleted(session, env) {
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const customerEmail = session.customer_email || session.customer_details?.email;

  // Generate license key from subscription ID
  const licenseKey = generateLicenseKey(subscriptionId);

  // Get tier from metadata or price ID
  const tier = session.metadata?.tier ||
               mapPriceToTier(session.line_items?.data?.[0]?.price?.id) ||
               'starter';

  // Calculate expiration (subscription billing period end)
  const expiresAt = session.subscription ?
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : // Default 30 days
    null;

  await env.LICENSES.put(licenseKey, JSON.stringify({
    tier: tier,
    status: 'active',
    customerId: customerId,
    subscriptionId: subscriptionId,
    customerEmail: customerEmail,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt,
  }));

  // Also store by subscription ID for updates
  await env.LICENSES.put(`sub:${subscriptionId}`, licenseKey);

  console.log(`License created: ${licenseKey} (${tier}) for ${customerEmail}`);

  // TODO: Send email with license key to customer
  // This would require an email service integration (e.g., SendGrid, Postmark)
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdate(subscription, env) {
  const subscriptionId = subscription.id;

  // Get license key from subscription mapping
  const licenseKey = await env.LICENSES.get(`sub:${subscriptionId}`);
  if (!licenseKey) {
    console.log(`No license found for subscription: ${subscriptionId}`);
    return;
  }

  const existing = await env.LICENSES.get(licenseKey, { type: 'json' });
  if (!existing) {
    console.log(`License data not found: ${licenseKey}`);
    return;
  }

  // Get new tier from price
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const tier = mapPriceToTier(priceId) || existing.tier;

  // Get new expiration
  const expiresAt = subscription.current_period_end ?
    new Date(subscription.current_period_end * 1000).toISOString() :
    existing.expiresAt;

  // Determine status
  let status = 'active';
  if (subscription.status === 'past_due') {
    status = 'past_due';
  } else if (subscription.status === 'canceled' || subscription.status === 'cancelled') {
    status = 'cancelled';
  } else if (subscription.status === 'unpaid') {
    status = 'suspended';
  }

  await env.LICENSES.put(licenseKey, JSON.stringify({
    ...existing,
    tier: tier,
    status: status,
    expiresAt: expiresAt,
    updatedAt: new Date().toISOString(),
  }));

  console.log(`License updated: ${licenseKey} (${tier}, ${status})`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(subscription, env) {
  const subscriptionId = subscription.id;

  // Get license key from subscription mapping
  const licenseKey = await env.LICENSES.get(`sub:${subscriptionId}`);
  if (!licenseKey) {
    console.log(`No license found for subscription: ${subscriptionId}`);
    return;
  }

  const license = await env.LICENSES.get(licenseKey, { type: 'json' });
  if (license) {
    await env.LICENSES.put(licenseKey, JSON.stringify({
      ...license,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    }));
    console.log(`License cancelled: ${licenseKey}`);
  }
}

/**
 * Generate license key from subscription ID
 */
function generateLicenseKey(subscriptionId) {
  // Create a deterministic but obfuscated key
  const prefix = 'COMP';
  const hash = subscriptionId.replace('sub_', '').substring(0, 8).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${hash}-${random}`;
}

/**
 * Map Stripe Price ID to tier
 * Update these with your actual Stripe Price IDs
 */
function mapPriceToTier(priceId) {
  const tierMap = {
    // Basic tier
    'price_1Sy4U9ARQXltxR7sonpbgGkv': 'starter',  // Basic monthly
    'price_1Sy4UiARQXltxR7sE0QewBsH': 'starter',  // Basic yearly
    // Pro tier
    'price_1Sy4VYARQXltxR7sSj4EE5aj': 'pro',      // Pro monthly
    'price_1Sy4VoARQXltxR7sfwUXnvc3': 'pro',      // Pro yearly
    // Enterprise tier
    'price_1Sy4WqARQXltxR7s0cZONtLA': 'enterprise', // Enterprise monthly
    'price_1Sy4X7ARQXltxR7s7EklrglS': 'enterprise', // Enterprise yearly
  };

  return tierMap[priceId] || null;
}

/**
 * Get features for a tier
 */
function getTierFeatures(tier) {
  const features = {
    free: {
      privateRepos: false,
      maxPrivateRepos: 0,
      frameworks: ['soc2'],
      pdfReports: false,
      slackIntegration: false,
    },
    starter: {
      privateRepos: true,
      maxPrivateRepos: 1,
      frameworks: ['soc2', 'gdpr', 'iso27001'],
      pdfReports: true,
      slackIntegration: false,
    },
    pro: {
      privateRepos: true,
      maxPrivateRepos: 5,
      frameworks: ['soc2', 'gdpr', 'iso27001'],
      pdfReports: true,
      slackIntegration: true,
    },
    enterprise: {
      privateRepos: true,
      maxPrivateRepos: -1, // Unlimited
      frameworks: ['soc2', 'gdpr', 'iso27001'],
      pdfReports: true,
      slackIntegration: true,
    },
  };

  return features[tier] || features.free;
}

/**
 * Admin: Get license details (requires admin token)
 */
async function handleAdminGetLicense(url, env, corsHeaders) {
  const adminToken = url.searchParams.get('admin_token');
  if (!adminToken || adminToken !== env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const key = url.searchParams.get('key');
  if (!key) {
    return new Response(JSON.stringify({ error: 'License key required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const licenseData = await env.LICENSES.get(key, { type: 'json' });
  return new Response(JSON.stringify(licenseData || { error: 'Not found' }), {
    status: licenseData ? 200 : 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Admin: Set/create license (requires admin token)
 */
async function handleAdminSetLicense(request, env, corsHeaders) {
  const url = new URL(request.url);
  const adminToken = url.searchParams.get('admin_token');
  if (!adminToken || adminToken !== env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { key, tier, expiresAt, customerEmail } = body;

    if (!key || !tier) {
      return new Response(JSON.stringify({ error: 'Key and tier required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await env.LICENSES.put(key, JSON.stringify({
      tier: tier,
      status: 'active',
      customerEmail: customerEmail || null,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
      isManual: true,
    }));

    return new Response(JSON.stringify({ success: true, key }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
