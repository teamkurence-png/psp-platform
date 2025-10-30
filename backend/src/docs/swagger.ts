import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PSP Platform Merchant API',
      version: '1.0.0',
      description: `
# PSP Platform Merchant API

Welcome to the PSP Platform Merchant API documentation. This API allows merchants to programmatically create and manage payment requests for **bank wire transfers** and **card payments**.

---

## 🚀 Quick Start

1. **Get your API key** from the merchant dashboard at \`/api-keys\`
2. **Choose your payment method:**
   - 🏦 **Bank Wire:** For B2B, large amounts, invoices (unlimited)
   - 💳 **Card Payment:** For B2C, small amounts, subscriptions (max $100000 USD)
3. **Make API requests** using the examples below

---

## 🔐 Authentication

All API endpoints require authentication using an API key. Generate keys from your merchant dashboard.

### Authentication Methods:

**Option 1: Authorization Header (Recommended)**
\`\`\`
Authorization: Bearer psp_live_your_api_key_here
\`\`\`

**Option 2: X-API-Key Header**
\`\`\`
X-API-Key: psp_live_your_api_key_here
\`\`\`

---

## 🏦 Bank Wire Transfer

**Perfect for large B2B transactions**

- ✅ No amount limits
- ✅ Automatic bank account assignment based on customer location
- ✅ Unique payment reference for tracking
- ✅ Complete bank details (IBAN, SWIFT, etc.)
- ⚠️ **All customer fields required:** name, email, phone, billingCountry

**What you get:**
- Complete bank account details
- Unique \`reason\` field (payment reference customer must include)

---

## 💳 Card Payment (PSP)

**Perfect for fast B2C transactions**

- ✅ Real-time payment processing
- ✅ 3D Secure authentication
- ✅ Hosted payment page
- ✅ Supports major card brands
- ⚠️ **Maximum $100000 USD per transaction**

**Required fields:**
- Customer billing country only

**Optional fields:**
- Customer name, email, phone (recommended for better tracking)

**What you get:**
- \`paymentLink\` URL where customer enters card details
- Real-time status updates

---

## 🔄 Dual Method Support

Offer both bank wire and card payment in a single request. Customer chooses their preferred method.

**Requirements:**
- Amount must be ≤ $100000 USD (card limit)
- All customer information required (for bank wire)
- Response includes both \`bankDetails\` and \`paymentLink\`

---

## ⚡ Rate Limiting

- **Limit:** 100 requests per minute per API key
- **Headers:** Check response headers for rate limit info
  - \`X-RateLimit-Limit\`: Maximum requests
  - \`X-RateLimit-Remaining\`: Remaining requests
  - \`X-RateLimit-Reset\`: Reset timestamp

---

## ⚠️ Error Handling

Standard HTTP status codes:

| Code | Meaning |
|------|---------|
| \`200\` | Success |
| \`201\` | Created |
| \`400\` | Bad Request (validation error) |
| \`401\` | Unauthorized (invalid API key) |
| \`403\` | Forbidden |
| \`404\` | Not Found |
| \`429\` | Rate limit exceeded |
| \`500\` | Server Error |

**Error Response Format:**
\`\`\`json
{
  "success": false,
  "error": "Error description"
}
\`\`\`

---

## 🔔 Webhooks

Receive real-time notifications when payment status changes by providing a \`callbackUrl\` in your payment request.

### Webhook Events

Your webhook endpoint will receive POST requests when payment status changes:

- \`payment.sent\` - Payment request created and sent to customer
- \`payment.pending_submission\` - Card payment initiated (waiting for customer to submit)
- \`payment.paid\` - Payment successfully received
- \`payment.cancelled\` - Payment request cancelled
- \`payment.failed\` - Payment failed

### Webhook Payload

\`\`\`json
{
  "event": "payment.paid",
  "paymentRequest": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "status": "paid",
    "amount": 5000.00,
    "currency": "USD",
    "invoiceNumber": "INV-2024-001",
    "description": "Invoice payment",
    "commissionAmount": 125.00,
    "netAmount": 4875.00,
    "paidAt": "2024-11-01T12:00:00Z",
    "createdAt": "2024-10-30T10:00:00Z",
    "updatedAt": "2024-11-01T12:00:00Z"
  },
  "timestamp": "2024-11-01T12:00:01Z"
}
\`\`\`

### Security - Signature Verification

Every webhook includes an \`X-Webhook-Signature\` header containing an HMAC SHA256 signature.

**Verify the signature to ensure the webhook is from our platform:**

\`\`\`javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler:
app.post('/webhooks/payment', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook...
  res.status(200).send('OK');
});
\`\`\`

### Webhook Headers

| Header | Description |
|--------|-------------|
| \`Content-Type\` | \`application/json\` |
| \`X-Webhook-Signature\` | HMAC SHA256 signature for verification |
| \`X-Webhook-Event\` | Event type (e.g., \`payment.paid\`) |
| \`User-Agent\` | \`PSP-Platform-Webhook/1.0\` |

### Retry Logic

If your endpoint returns a non-2xx status code or times out, we'll retry:
- **Attempt 1:** Immediate
- **Attempt 2:** After 1 second
- **Attempt 3:** After 4 seconds
- **Attempt 4:** After 9 seconds (final attempt)

### Best Practices

1. ✅ **Respond quickly** - Return 200 OK immediately, process async
2. ✅ **Verify signature** - Always verify the HMAC signature
3. ✅ **Handle duplicates** - Use \`paymentRequest.id\` to detect duplicates
4. ✅ **Use HTTPS** - Webhook URLs must use HTTPS in production
5. ✅ **Log everything** - Keep logs for debugging and auditing

---

## 📚 Additional Resources

- **Full Documentation:** See \`backend/API.md\` for detailed code examples
- **Code Examples:** Available in Node.js, Python, PHP, and cURL
- **Support:** Contact support@pspplatform.com

---
          `,
      contact: {
        name: 'API Support',
        email: 'support@pspplatform.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'https://psp-platform-8nm0.onrender.com',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for merchant authentication',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for dashboard authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        PaymentRequest: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            description: { type: 'string' },
            invoiceNumber: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time' },
            status: { type: 'string' },
            paymentMethods: {
              type: 'array',
              items: { type: 'string', enum: ['bank_wire', 'card'] },
            },
            paymentLink: {
              type: 'string',
              description: 'Payment link for card payments',
            },
            bankDetails: {
              type: 'object',
              description: 'Bank details for wire transfers',
              properties: {
                rails: { type: 'array', items: { type: 'string' } },
                beneficiaryName: { type: 'string' },
                iban: { type: 'string' },
                accountNumber: { type: 'string' },
                routingNumber: { type: 'string' },
                swiftCode: { type: 'string' },
                bankName: { type: 'string' },
                bankAddress: { type: 'string' },
              },
            },
            reason: {
              type: 'string',
              description: 'Payment reference for bank wire',
            },
            customerInfo: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                billingCountry: { type: 'string' },
              },
            },
            commissionPercent: { type: 'number' },
            commissionAmount: { type: 'number' },
            netAmount: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            prefix: { type: 'string', example: 'psp_live_abc' },
            name: { type: 'string' },
            isActive: { type: 'boolean' },
            lastUsedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
            permissions: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Merchant API',
        description: 'Endpoints for merchant integrations (API key authentication)',
      },
      {
        name: 'API Keys',
        description: 'Manage API keys (dashboard authentication)',
      },
    ],
  },
  apis: [
    './src/controllers/merchantApiController.ts',
    './src/controllers/apiKeyController.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Serve Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'PSP Platform API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
      customfavIcon: '/favicon.ico',
    })
  );

  // Serve raw OpenAPI spec as JSON
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 API Documentation available at /api/docs');
};

export { swaggerSpec };

