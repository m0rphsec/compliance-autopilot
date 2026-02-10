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

    // Subscription flow endpoints
    if (url.pathname === '/success' && request.method === 'GET') {
      return handleSuccess(url, env, corsHeaders);
    }

    if (url.pathname === '/lookup' && request.method === 'GET') {
      return handleLookup(url, env, corsHeaders);
    }

    if (url.pathname === '/portal' && request.method === 'GET') {
      return handlePortal(url, env, corsHeaders);
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

  // Store email-to-key mapping for lookup
  if (customerEmail) {
    await env.LICENSES.put(`email:${customerEmail}`, licenseKey);
  }

  console.log(`License created: ${licenseKey} (${tier}) for ${customerEmail}`);

  // Send license key via email (non-blocking)
  if (customerEmail) {
    await sendLicenseEmail(customerEmail, licenseKey, tier, env).catch(err => {
      console.error('Email send failed but license was created:', err);
    });
  } else {
    console.warn('No customer email - license created but email not sent');
  }
}

/**
 * Send license key email via Resend
 */
async function sendLicenseEmail(customerEmail, licenseKey, tier, env) {
  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
  const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7fafc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #1a56db; margin: 0;">Compliance Autopilot</h1>
    </div>
    <h2 style="color: #2d3748;">Welcome to the ${tierName} Plan!</h2>
    <p style="color: #4a5568; line-height: 1.6;">Thank you for subscribing. Your license has been activated and is ready to use.</p>
    <div style="background: #f7fafc; border-left: 4px solid #1a56db; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <h3 style="color: #2d3748; margin: 0 0 12px 0;">Your License Key</h3>
      <div style="background: white; padding: 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 18px; color: #d53f8c; word-break: break-all;">${licenseKey}</div>
    </div>
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <h3 style="color: #92400e; margin: 0 0 12px 0;">Quick Setup (2 minutes)</h3>
      <ol style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Go to your GitHub repository</li>
        <li>Click <strong>Settings</strong> &rarr; <strong>Secrets and variables</strong> &rarr; <strong>Actions</strong></li>
        <li>Click <strong>New repository secret</strong></li>
        <li>Name: <code style="background: #fef3c7; padding: 2px 6px; border-radius: 3px;">LICENSE_KEY</code></li>
        <li>Value: Paste your license key above</li>
        <li>Add <code style="background: #fef3c7; padding: 2px 6px; border-radius: 3px;">license-key: \${{ secrets.LICENSE_KEY }}</code> to your workflow</li>
      </ol>
    </div>
    <div style="margin: 24px 0;">
      <p style="margin-bottom: 8px;"><a href="https://github.com/m0rphsec/compliance-autopilot#-quick-start" style="color: #1a56db;">Quick Start Guide</a></p>
      <p style="margin-bottom: 8px;"><a href="https://github.com/m0rphsec/compliance-autopilot/tree/main/docs" style="color: #1a56db;">Full Documentation</a></p>
      <p style="margin-bottom: 8px;"><a href="https://github.com/m0rphsec/compliance-autopilot/issues" style="color: #1a56db;">Support &amp; Issues</a></p>
    </div>
    <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; color: #718096; font-size: 14px; text-align: center;">
      <p style="margin: 0;">Keep this email for your records.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Compliance Autopilot <onboarding@resend.dev>',
        to: customerEmail,
        subject: `Your Compliance Autopilot License Key - ${tierName} Plan`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('License email sent:', result.id);
    return true;
  } catch (error) {
    console.error('Failed to send license email:', error);
    return false;
  }
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

/**
 * Handle checkout success page
 * GET /success?session_id=xxx
 */
async function handleSuccess(url, env, corsHeaders) {
  const sessionId = url.searchParams.get('session_id');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Compliance Autopilot</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 48px;
            max-width: 600px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        h1 {
            color: #1a202c;
            font-size: 32px;
            margin-bottom: 16px;
        }
        .success-icon {
            width: 64px;
            height: 64px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            color: white;
            font-size: 36px;
        }
        p {
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 16px;
        }
        .info-box {
            background: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .info-box h2 {
            color: #2d3748;
            font-size: 18px;
            margin-bottom: 12px;
        }
        .steps {
            list-style: none;
            counter-reset: step-counter;
        }
        .steps li {
            counter-increment: step-counter;
            position: relative;
            padding-left: 40px;
            margin-bottom: 16px;
            color: #2d3748;
        }
        .steps li::before {
            content: counter(step-counter);
            position: absolute;
            left: 0;
            top: 0;
            background: #667eea;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        }
        code {
            background: #edf2f7;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #d53f8c;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            margin-top: 24px;
            transition: background 0.2s;
        }
        .button:hover {
            background: #5a67d8;
        }
        .email-notice {
            background: #fff5e6;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin: 16px 0;
            border-radius: 4px;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✓</div>
        <h1>Thank you for subscribing!</h1>
        <p>Welcome to Compliance Autopilot. Your subscription has been activated successfully.</p>

        ${sessionId ? '<p class="email-notice"><strong>📧 Your license key is being generated and will be emailed to you shortly.</strong> If you don\'t receive it within 5 minutes, check your spam folder or use the lookup link below.</p>' : ''}

        <div class="info-box">
            <h2>Next Steps: Add Your License Key</h2>
            <ol class="steps">
                <li>Go to your GitHub repository</li>
                <li>Click on <strong>Settings</strong></li>
                <li>Navigate to <strong>Secrets and variables</strong> → <strong>Actions</strong></li>
                <li>Click <strong>New repository secret</strong></li>
                <li>Set name to: <code>LICENSE_KEY</code></li>
                <li>Paste your license key as the value</li>
                <li>Click <strong>Add secret</strong></li>
            </ol>
        </div>

        <p>Once configured, Compliance Autopilot will automatically validate your license key and enable premium features for your repository.</p>

        ${!sessionId ? '<p><strong>Lost your license key?</strong> Contact support with your email address to retrieve it.</p>' : ''}

        <a href="https://github.com/m0rphsec/compliance-autopilot" class="button">View Documentation</a>
    </div>
</body>
</html>
  `;

  return new Response(html, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/html' },
  });
}

/**
 * Handle license key lookup by email
 * GET /lookup?email=xxx&admin_token=xxx
 */
async function handleLookup(url, env, corsHeaders) {
  const email = url.searchParams.get('email');
  const adminToken = url.searchParams.get('admin_token');

  // Require admin token for now
  if (!adminToken || adminToken !== env.ADMIN_TOKEN) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>License Lookup - Unauthorized</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 48px;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        h1 {
            color: #e53e3e;
            margin-bottom: 16px;
        }
        p {
            color: #4a5568;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔒 Unauthorized</h1>
        <p>License lookup requires authentication. Please contact support for assistance.</p>
    </div>
</body>
</html>
    `;
    return new Response(html, {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  }

  if (!email) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>License Lookup - Email Required</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 48px;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        h1 {
            color: #e53e3e;
            margin-bottom: 16px;
        }
        p {
            color: #4a5568;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ Email Required</h1>
        <p>Please provide an email address to lookup your license key.</p>
    </div>
</body>
</html>
    `;
    return new Response(html, {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  }

  try {
    // Look up license by email
    const licenseKey = await env.LICENSES.get(`email:${email}`);

    if (!licenseKey) {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>License Not Found</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 48px;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        h1 {
            color: #e53e3e;
            margin-bottom: 16px;
        }
        p {
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>❌ License Not Found</h1>
        <p>No license found for: <strong>${email}</strong></p>
        <p>Please verify your email address or contact support for assistance.</p>
    </div>
</body>
</html>
      `;
      return new Response(html, {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Get full license details
    const licenseData = await env.LICENSES.get(licenseKey, { type: 'json' });

    // Mask the license key (show first 4 and last 4 chars)
    const maskedKey = licenseKey.length > 8
      ? `${licenseKey.substring(0, 4)}...${licenseKey.substring(licenseKey.length - 4)}`
      : licenseKey;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>License Found</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 48px;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        h1 {
            color: #10b981;
            margin-bottom: 24px;
            text-align: center;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label {
            color: #718096;
            font-weight: 600;
        }
        .value {
            color: #2d3748;
            font-weight: 500;
        }
        .key-value {
            font-family: 'Courier New', monospace;
            background: #edf2f7;
            padding: 4px 8px;
            border-radius: 4px;
            color: #d53f8c;
        }
        .notice {
            background: #fff5e6;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin-top: 24px;
            border-radius: 4px;
            color: #92400e;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✓ License Found</h1>
        <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${email}</span>
        </div>
        <div class="info-row">
            <span class="label">License Key:</span>
            <span class="value key-value">${maskedKey}</span>
        </div>
        <div class="info-row">
            <span class="label">Tier:</span>
            <span class="value">${licenseData?.tier || 'Unknown'}</span>
        </div>
        <div class="info-row">
            <span class="label">Status:</span>
            <span class="value">${licenseData?.status || 'Unknown'}</span>
        </div>
        <div class="notice">
            <strong>Note:</strong> The full license key has been sent to your email address. Contact support if you need further assistance.
        </div>
    </div>
</body>
</html>
    `;

    return new Response(html, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Lookup error:', error);
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lookup Error</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 48px;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        h1 {
            color: #e53e3e;
            margin-bottom: 16px;
        }
        p {
            color: #4a5568;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ Service Error</h1>
        <p>An error occurred while looking up your license. Please try again later or contact support.</p>
    </div>
</body>
</html>
    `;
    return new Response(html, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  }
}

/**
 * Handle customer portal redirect
 * GET /portal
 */
async function handlePortal(url, env, corsHeaders) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Management</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 48px;
            max-width: 600px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        h1 {
            color: #1a202c;
            font-size: 32px;
            margin-bottom: 16px;
        }
        p {
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 16px;
        }
        .info-box {
            background: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 24px 0;
            border-radius: 4px;
            text-align: left;
        }
        .info-box h2 {
            color: #2d3748;
            font-size: 18px;
            margin-bottom: 12px;
        }
        ul {
            list-style: none;
            padding-left: 0;
        }
        ul li {
            padding: 8px 0;
            color: #2d3748;
        }
        ul li::before {
            content: "✓ ";
            color: #10b981;
            font-weight: bold;
            margin-right: 8px;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            margin-top: 24px;
            transition: background 0.2s;
        }
        .button:hover {
            background: #5a67d8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💳 Subscription Management</h1>
        <p>Manage your Compliance Autopilot subscription through our support team.</p>

        <div class="info-box">
            <h2>What You Can Do:</h2>
            <ul>
                <li>Update payment method</li>
                <li>Change subscription tier</li>
                <li>View billing history</li>
                <li>Cancel subscription</li>
                <li>Retrieve license key</li>
            </ul>
        </div>

        <p>To make changes to your subscription, please contact our support team with your account details.</p>

        <a href="https://github.com/m0rphsec/compliance-autopilot/issues" class="button">Contact Support</a>
    </div>
</body>
</html>
  `;

  return new Response(html, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/html' },
  });
}
