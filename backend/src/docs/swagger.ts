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
   - 💳 **Card Payment:** For B2C, small amounts, subscriptions (max $250 USD)
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

## 📊 Payment Methods Comparison

| Feature | Bank Wire 🏦 | Card Payment 💳 |
|---------|-------------|-----------------|
| **Best For** | B2B, Large amounts | B2C, Small amounts |
| **Amount Limit** | Unlimited | Max $250 USD |
| **Processing** | 1-3 business days | Real-time |
| **Required Info** | Name, Email, Phone, Country | Country (others recommended) |
| **Returns** | Bank details + Reference | Payment link |
| **Use Cases** | Invoices, Consulting | Subscriptions, Products |
| **Commission** | 2-3% | 3-4% |

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
- ⚠️ **Maximum $250 USD per transaction**

**What you get:**
- \`paymentLink\` URL where customer enters card details
- Real-time status updates

---

## 🔄 Dual Method Support

Offer both bank wire and card payment in a single request. Customer chooses their preferred method.

**Requirements:**
- Amount must be ≤ $250 USD (card limit)
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
        url: process.env.API_BASE_URL || 'http://localhost:5000',
        description: 'API Server',
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

