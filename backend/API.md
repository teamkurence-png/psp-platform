# PSP Platform Merchant API Documentation

Welcome to the PSP Platform Merchant API! This API allows you to programmatically create and manage payment requests for bank wire and card payments.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Payment Methods](#payment-methods)
- [Endpoints](#endpoints)
- [Code Examples](#code-examples)
- [Error Handling](#error-handling)
- [Webhooks](#webhooks)

## Getting Started

### Base URL

```
Production: https://psp-platform-8nm0.onrender.com
Development: http://localhost:5000
```

### Interactive Documentation

Visit our interactive API documentation at:
```
https://psp-platform-8nm0.onrender.com/api/docs
```

## Authentication

All API requests require authentication using an API key. You can generate and manage API keys from your merchant dashboard at `/api-keys`.

### API Key Format

API keys follow this format:
```
psp_live_<32_random_characters>
```

### How to Authenticate

Include your API key in requests using one of these methods:

**Option 1: Authorization Header (Recommended)**
```bash
Authorization: Bearer psp_live_your_api_key_here
```

**Option 2: X-API-Key Header**
```bash
X-API-Key: psp_live_your_api_key_here
```

### Security Best Practices

- **Never expose your API key** in client-side code, public repositories, or version control
- **Store API keys securely** using environment variables or secure vaults
- **Use HTTPS** for all API requests in production
- **Rotate keys regularly** and revoke compromised keys immediately
- **Monitor API key usage** from your dashboard

## Rate Limiting

API requests are rate limited to protect system stability:

- **Limit:** 100 requests per minute per API key
- **Rate limit headers** are included in all responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: ISO timestamp when limit resets

When rate limited, you'll receive a `429 Too Many Requests` response with a `Retry-After` header.

## Payment Methods

### Bank Wire Transfer

Create payment requests for bank wire transfers with automatic bank assignment.

**Features:**
- ✅ Automatic bank account selection based on customer location
- ✅ Support for multiple currencies and countries
- ✅ Unique payment reference generation for tracking
- ✅ Complete bank details provided in response
- ✅ No amount limits - perfect for large transactions
- ✅ Lower commission rates

**Required Fields:**
- Customer name, email, phone *(all required)*
- Customer billing country (ISO code)
- Amount and currency
- Invoice number and due date

**Response Includes:**
- Complete bank details (IBAN, SWIFT, account number, routing number)
- Beneficiary information
- Unique payment reference (`reason`) - customer must include this in transfer

### Card Payment (PSP)

Create payment requests for card payments via payment service provider.

**Features:**
- ✅ Hosted payment page with secure card processing
- ✅ Real-time payment confirmation
- ✅ Support for multiple card brands (Visa, Mastercard, etc.)
- ✅ 3D Secure authentication for enhanced security
- ✅ Instant customer experience
- ✅ No bank transfer delays

**Limits:**
- ⚠️ Maximum amount: **$250 USD** per transaction

**Required Fields:**
- Customer billing country (ISO code) *(required)*

**Optional Fields:**
- Customer name, email, phone *(recommended but not required)*

**Response Includes:**
- Payment link URL for customer to complete payment
- Unique payment token for tracking

### Dual Method Support

You can specify both payment methods in a single request. The customer will be able to choose their preferred method, and the response will include both bank details and payment link.

**Use this when:**
- You want to offer maximum flexibility to customers
- Customer preference is unknown
- Amount is within card payment limit ($250 USD)

## Endpoints

### Create Payment Request

Create a new payment request for bank wire, card, or both payment methods.

**Endpoint:** `POST /api/v1/merchant/payment-requests`

**📖 Quick Links:**
- [Example 1: Bank Wire Transfer →](#-example-1-bank-wire-transfer-payment-request)
- [Example 2: Card Payment (PSP) →](#-example-2-card-payment-psp-request)
- [Example 3: Both Methods →](#-example-3-both-payment-methods-flexible)

---

#### 📋 Example 1: Bank Wire Transfer Payment Request

Perfect for larger amounts and B2B transactions. The system automatically assigns an appropriate bank account based on the customer's location.

**Request:**
```bash
POST /api/v1/merchant/payment-requests
Content-Type: application/json
Authorization: Bearer psp_live_your_api_key_here
```

```json
{
  "amount": 5000.00,
  "currency": "USD",
  "description": "Invoice payment for Q4 consulting services",
  "invoiceNumber": "INV-2024-001",
  "dueDate": "2024-12-31",
  "customerReference": "CLIENT-ACME-2024",
  "customerInfo": {
    "name": "John Smith",
    "email": "john.smith@acmecorp.com",
    "phone": "+1-555-123-4567",
    "billingCountry": "US"
  },
  "paymentMethods": ["bank_wire"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "amount": 5000.00,
    "currency": "USD",
    "description": "Invoice payment for Q4 consulting services",
    "invoiceNumber": "INV-2024-001",
    "dueDate": "2024-12-31T00:00:00.000Z",
    "status": "sent",
    "paymentMethods": ["bank_wire"],
    "bankDetails": {
      "rails": ["SWIFT"],
      "beneficiaryName": "Your Company LLC",
      "iban": "GB29NWBK60161331926819",
      "accountNumber": "12345678",
      "routingNumber": "026009593",
      "swiftCode": "BOFAUS3N",
      "bankName": "Bank of America",
      "bankAddress": "123 Bank St, New York, NY 10001"
    },
    "reason": "PAY-XYZ789DEF",
    "customerInfo": {
      "name": "John Smith",
      "email": "john.smith@acmecorp.com",
      "phone": "+1-555-123-4567",
      "billingCountry": "US"
    },
    "commissionPercent": 2.5,
    "commissionAmount": 125.00,
    "netAmount": 4875.00,
    "createdAt": "2024-10-30T12:00:00.000Z",
    "updatedAt": "2024-10-30T12:00:00.000Z"
  }
}
```

**Important Notes for Bank Wire:**
- ✅ All customer information fields (`name`, `email`, `phone`) are **required**
- ✅ The `reason` field is the **payment reference** your customer must include in their bank transfer
- ✅ Bank details are automatically assigned based on the customer's `billingCountry`
- ✅ No amount limits for bank wire transfers
- ✅ Customer should transfer the exact `amount` specified and include the `reason` in the payment reference

---

#### 💳 Example 2: Card Payment (PSP) Request

Perfect for smaller amounts and B2C transactions. Maximum amount is $250 USD.

**Request:**
```bash
POST /api/v1/merchant/payment-requests
Content-Type: application/json
Authorization: Bearer psp_live_your_api_key_here
```

```json
{
  "amount": 149.99,
  "currency": "USD",
  "description": "Premium subscription - Annual plan",
  "invoiceNumber": "INV-2024-SUB-789",
  "dueDate": "2024-11-15",
  "customerReference": "USER-456",
  "customerInfo": {
    "name": "Sarah Johnson",
    "email": "sarah.johnson@email.com",
    "phone": "+1-555-987-6543",
    "billingCountry": "US"
  },
  "paymentMethods": ["card"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "amount": 149.99,
    "currency": "USD",
    "description": "Premium subscription - Annual plan",
    "invoiceNumber": "INV-2024-SUB-789",
    "dueDate": "2024-11-15T00:00:00.000Z",
    "status": "pending_submission",
    "paymentMethods": ["card"],
    "paymentLink": "https://pay.yourplatform.com/pay/abc123token456",
    "customerInfo": {
      "name": "Sarah Johnson",
      "email": "sarah.johnson@email.com",
      "phone": "+1-555-987-6543",
      "billingCountry": "US"
    },
    "commissionPercent": 3.5,
    "commissionAmount": 5.25,
    "netAmount": 144.74,
    "createdAt": "2024-10-30T12:00:00.000Z",
    "updatedAt": "2024-10-30T12:00:00.000Z"
  }
}
```

**Important Notes for Card Payment:**
- ✅ Maximum amount: **$250 USD**
- ✅ **Only `billingCountry` is required** - customer name, email, and phone are optional (but recommended for better tracking)
- ✅ The `paymentLink` is a hosted payment page where customers enter their card details
- ✅ Initial status is `pending_submission` until the customer submits payment
- ✅ Real-time payment status updates via webhooks (coming soon)
- ✅ Supports 3D Secure authentication for enhanced security

---

#### 🔄 Example 3: Both Payment Methods (Flexible)

Allow customers to choose their preferred payment method.

**Request:**
```json
{
  "amount": 200.00,
  "currency": "USD",
  "description": "Invoice payment for web design services",
  "invoiceNumber": "INV-2024-WEB-101",
  "dueDate": "2024-12-15",
  "customerInfo": {
    "name": "Michael Chen",
    "email": "michael.chen@company.com",
    "phone": "+1-555-222-3333",
    "billingCountry": "US"
  },
  "paymentMethods": ["bank_wire", "card"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "amount": 200.00,
    "currency": "USD",
    "description": "Invoice payment for web design services",
    "invoiceNumber": "INV-2024-WEB-101",
    "dueDate": "2024-12-15T00:00:00.000Z",
    "status": "sent",
    "paymentMethods": ["bank_wire", "card"],
    "paymentLink": "https://pay.yourplatform.com/pay/xyz789token",
    "bankDetails": {
      "rails": ["SWIFT"],
      "beneficiaryName": "Your Company LLC",
      "iban": "GB29NWBK60161331926819",
      "accountNumber": "12345678",
      "routingNumber": "026009593",
      "swiftCode": "BOFAUS3N",
      "bankName": "Bank of America",
      "bankAddress": "123 Bank St, New York, NY 10001"
    },
    "reason": "PAY-ABC456GHI",
    "customerInfo": {
      "name": "Michael Chen",
      "email": "michael.chen@company.com",
      "phone": "+1-555-222-3333",
      "billingCountry": "US"
    },
    "commissionPercent": 3.0,
    "commissionAmount": 6.00,
    "netAmount": 194.00,
    "createdAt": "2024-10-30T12:00:00.000Z",
    "updatedAt": "2024-10-30T12:00:00.000Z"
  }
}
```

**Important Notes for Dual Methods:**
- ✅ Both `paymentLink` and `bankDetails` are included in the response
- ✅ Customer can choose their preferred payment method
- ✅ All customer information fields must be provided since bank wire is included
- ✅ Amount must be ≤ $250 USD since card payment is included

### List Payment Requests

Retrieve a paginated list of your payment requests with optional filtering.

**Endpoint:** `GET /api/v1/merchant/payment-requests`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status
- `startDate` (optional): Filter from date (ISO format)
- `endDate` (optional): Filter to date (ISO format)

**Example Request:**
```bash
GET /api/v1/merchant/payment-requests?page=1&limit=20&status=paid
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "amount": 100.00,
      "status": "paid",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Get Payment Request

Retrieve details of a specific payment request.

**Endpoint:** `GET /api/v1/merchant/payment-requests/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "amount": 100.00,
    "status": "paid",
    ...
  }
}
```

### Cancel Payment Request

Cancel a payment request that hasn't been paid yet.

**Endpoint:** `POST /api/v1/merchant/payment-requests/:id/cancel`

**Response:**
```json
{
  "success": true,
  "message": "Payment request cancelled successfully",
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "status": "cancelled",
    ...
  }
}
```

## Code Examples

### Node.js / JavaScript

```javascript
const axios = require('axios');

const API_KEY = process.env.PSP_API_KEY;
const BASE_URL = 'https://psp-platform-8nm0.onrender.com';

// Create payment request
async function createPaymentRequest() {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/merchant/payment-requests`,
      {
        amount: 100.00,
        currency: 'USD',
        description: 'Invoice payment',
        invoiceNumber: 'INV-2024-001',
        dueDate: '2024-12-31',
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          billingCountry: 'US'
        },
        paymentMethods: ['bank_wire', 'card']
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Payment request created:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// List payment requests
async function listPaymentRequests() {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/merchant/payment-requests?page=1&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );
    
    console.log('Payment requests:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Get specific payment request
async function getPaymentRequest(id) {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/merchant/payment-requests/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );
    
    console.log('Payment request:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}
```

### Python

```python
import requests
import os
from datetime import datetime, timedelta

API_KEY = os.environ.get('PSP_API_KEY')
BASE_URL = 'https://psp-platform-8nm0.onrender.com'

# Create payment request
def create_payment_request():
    url = f'{BASE_URL}/api/v1/merchant/payment-requests'
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    due_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
    
    data = {
        'amount': 100.00,
        'currency': 'USD',
        'description': 'Invoice payment',
        'invoiceNumber': 'INV-2024-001',
        'dueDate': due_date,
        'customerInfo': {
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '+1234567890',
            'billingCountry': 'US'
        },
        'paymentMethods': ['bank_wire', 'card']
    }
    
    response = requests.post(url, json=data, headers=headers)
    response.raise_for_status()
    
    result = response.json()
    print('Payment request created:', result['data'])
    return result['data']

# List payment requests
def list_payment_requests(page=1, limit=10):
    url = f'{BASE_URL}/api/v1/merchant/payment-requests'
    headers = {'Authorization': f'Bearer {API_KEY}'}
    params = {'page': page, 'limit': limit}
    
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    
    result = response.json()
    print(f"Found {result['pagination']['total']} payment requests")
    return result['data']

# Get specific payment request
def get_payment_request(payment_id):
    url = f'{BASE_URL}/api/v1/merchant/payment-requests/{payment_id}'
    headers = {'Authorization': f'Bearer {API_KEY}'}
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    result = response.json()
    return result['data']

# Cancel payment request
def cancel_payment_request(payment_id):
    url = f'{BASE_URL}/api/v1/merchant/payment-requests/{payment_id}/cancel'
    headers = {'Authorization': f'Bearer {API_KEY}'}
    
    response = requests.post(url, headers=headers)
    response.raise_for_status()
    
    result = response.json()
    print('Payment request cancelled:', result['data'])
    return result['data']

if __name__ == '__main__':
    # Example usage
    try:
        payment_request = create_payment_request()
        print(f"\nPayment link: {payment_request.get('paymentLink')}")
        print(f"Bank reference: {payment_request.get('reason')}")
    except requests.exceptions.HTTPError as e:
        print(f'Error: {e.response.json()}')
```

### PHP

```php
<?php

class PSPClient {
    private $apiKey;
    private $baseUrl;
    
    public function __construct($apiKey, $baseUrl = 'https://psp-platform-8nm0.onrender.com') {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }
    
    private function request($method, $endpoint, $data = null) {
        $url = $this->baseUrl . $endpoint;
        
        $headers = [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json'
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 400) {
            throw new Exception("HTTP Error $httpCode: $response");
        }
        
        return json_decode($response, true);
    }
    
    public function createPaymentRequest($data) {
        return $this->request('POST', '/api/v1/merchant/payment-requests', $data);
    }
    
    public function listPaymentRequests($page = 1, $limit = 10) {
        return $this->request('GET', "/api/v1/merchant/payment-requests?page=$page&limit=$limit");
    }
    
    public function getPaymentRequest($id) {
        return $this->request('GET', "/api/v1/merchant/payment-requests/$id");
    }
    
    public function cancelPaymentRequest($id) {
        return $this->request('POST', "/api/v1/merchant/payment-requests/$id/cancel");
    }
}

// Usage
$apiKey = getenv('PSP_API_KEY');
$client = new PSPClient($apiKey);

try {
    $paymentRequest = $client->createPaymentRequest([
        'amount' => 100.00,
        'currency' => 'USD',
        'description' => 'Invoice payment',
        'invoiceNumber' => 'INV-2024-001',
        'dueDate' => date('Y-m-d', strtotime('+30 days')),
        'customerInfo' => [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '+1234567890',
            'billingCountry' => 'US'
        ],
        'paymentMethods' => ['bank_wire', 'card']
    ]);
    
    echo "Payment created: " . $paymentRequest['data']['id'] . "\n";
    echo "Payment link: " . $paymentRequest['data']['paymentLink'] . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
```

### cURL

```bash
# Create payment request
curl -X POST https://psp-platform-8nm0.onrender.com/api/v1/merchant/payment-requests \
  -H "Authorization: Bearer psp_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "description": "Invoice payment",
    "invoiceNumber": "INV-2024-001",
    "dueDate": "2024-12-31",
    "customerInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "billingCountry": "US"
    },
    "paymentMethods": ["bank_wire", "card"]
  }'

# List payment requests
curl -X GET "https://psp-platform-8nm0.onrender.com/api/v1/merchant/payment-requests?page=1&limit=10" \
  -H "Authorization: Bearer psp_live_your_api_key_here"

# Get specific payment request
curl -X GET "https://psp-platform-8nm0.onrender.com/api/v1/merchant/payment-requests/64f1a2b3c4d5e6f7g8h9i0j1" \
  -H "Authorization: Bearer psp_live_your_api_key_here"

# Cancel payment request
curl -X POST "https://psp-platform-8nm0.onrender.com/api/v1/merchant/payment-requests/64f1a2b3c4d5e6f7g8h9i0j1/cancel" \
  -H "Authorization: Bearer psp_live_your_api_key_here"
```

## Error Handling

The API uses standard HTTP status codes and returns errors in a consistent format.

### Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request (validation error)
- `401 Unauthorized`: Invalid or missing API key
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Validation Errors

When validation fails, the error field contains an array of validation issues:

```json
{
  "success": false,
  "error": [
    {
      "code": "invalid_type",
      "message": "Customer name is required for bank wire transfers",
      "path": ["customerInfo", "name"]
    }
  ]
}
```

### Common Errors

**Invalid API Key**
```json
{
  "success": false,
  "error": "Invalid or expired API key."
}
```

**Rate Limit Exceeded**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

**Payment Method Unavailable**
```json
{
  "success": false,
  "error": "No suitable payment processors available. The following methods cannot be used: Bank Wire (no active bank accounts available for FR)."
}
```

**Card Payment Limit Exceeded**
```json
{
  "success": false,
  "error": "Card payments are limited to a maximum of $250 USD. For higher amounts, please use Bank Wire Transfer."
}
```

## Payment Statuses

Payment requests can have the following statuses:

- `sent`: Payment request created and sent to customer
- `viewed`: Customer has viewed the payment request
- `pending_submission`: Card details are being entered
- `submitted`: Payment submitted for processing
- `awaiting_3d_sms`: Awaiting 3D Secure SMS verification
- `awaiting_3d_push`: Awaiting 3D Secure push notification
- `verification_completed`: 3D Secure verification completed
- `processed_awaiting_exchange`: Payment processed, awaiting crypto exchange
- `processed`: Payment successfully processed
- `paid`: Payment confirmed and settled
- `rejected`: Payment rejected
- `insufficient_funds`: Payment failed due to insufficient funds
- `failed`: Payment failed (admin marked as failed, e.g., stuck in 3D verification)
- `expired`: Payment request expired
- `cancelled`: Payment request cancelled

## Webhooks

Receive real-time notifications when payment status changes by providing a `callbackUrl` when creating a payment request.

### Webhook Events

Your webhook endpoint will receive POST requests when payment status changes:

- `payment.sent` - Payment request created and sent to customer
- `payment.pending_submission` - Card payment initiated (waiting for customer to submit)
- `payment.paid` - Payment successfully received
- `payment.cancelled` - Payment request cancelled
- `payment.failed` - Payment failed

### Setting Up Webhooks

Include a `callbackUrl` in your payment request:

```javascript
const paymentRequest = {
  amount: 5000.00,
  currency: "USD",
  description: "Invoice payment for Q4 consulting services",
  invoiceNumber: "INV-2024-001",
  dueDate: "2024-12-31",
  callbackUrl: "https://your-domain.com/webhooks/payment", // Your webhook endpoint
  customerInfo: {
    name: "John Smith",
    email: "john.smith@acmecorp.com",
    phone: "+1-555-123-4567",
    billingCountry: "US"
  },
  paymentMethods: ["bank_wire"]
};
```

### Webhook Payload

When a payment status changes, we'll send a POST request to your `callbackUrl` with this payload:

```json
{
  "event": "payment.paid",
  "paymentRequest": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "status": "paid",
    "amount": 5000.00,
    "currency": "USD",
    "invoiceNumber": "INV-2024-001",
    "description": "Invoice payment for Q4 consulting services",
    "customerReference": "CLIENT-ACME-2024",
    "commissionAmount": 125.00,
    "netAmount": 4875.00,
    "paidAt": "2024-11-01T12:00:00.000Z",
    "createdAt": "2024-10-30T10:00:00.000Z",
    "updatedAt": "2024-11-01T12:00:00.000Z"
  },
  "timestamp": "2024-11-01T12:00:01.000Z"
}
```

### Webhook Headers

Every webhook request includes these headers:

| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `application/json` | Request body format |
| `X-Webhook-Signature` | HMAC SHA256 signature | Security signature for verification |
| `X-Webhook-Event` | Event type | e.g., `payment.paid`, `payment.cancelled` |
| `User-Agent` | `PSP-Platform-Webhook/1.0` | Identifies requests from our platform |

### Security - Signature Verification

**IMPORTANT:** Always verify the webhook signature to ensure the request is from our platform.

Every webhook includes an `X-Webhook-Signature` header containing an HMAC SHA256 signature of the payload.

#### Node.js Example

```javascript
const crypto = require('crypto');
const express = require('express');

const app = express();
app.use(express.json());

// Your webhook secret (contact support to get your secret)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

app.post('/webhooks/payment', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const event = req.headers['x-webhook-event'];
  
  // Verify signature
  if (!verifyWebhookSignature(req.body, signature, WEBHOOK_SECRET)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  const { paymentRequest } = req.body;
  console.log(`Webhook received: ${event} for payment ${paymentRequest.id}`);
  
  // Handle different events
  switch (event) {
    case 'payment.paid':
      console.log(`Payment ${paymentRequest.id} has been paid!`);
      // Update your database, send confirmation email, etc.
      break;
    
    case 'payment.cancelled':
      console.log(`Payment ${paymentRequest.id} was cancelled`);
      // Handle cancellation
      break;
    
    case 'payment.failed':
      console.log(`Payment ${paymentRequest.id} failed`);
      // Handle failure
      break;
  }
  
  // Respond quickly (within 10 seconds)
  res.status(200).json({ received: true });
});

app.listen(3000, () => console.log('Webhook server running on port 3000'));
```

#### Python Example

```python
import hmac
import hashlib
import json
from flask import Flask, request, jsonify

app = Flask(__name__)

# Your webhook secret (contact support to get your secret)
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET')

def verify_webhook_signature(payload, signature, secret):
    """Verify the webhook signature using HMAC SHA256"""
    payload_string = json.dumps(payload, separators=(',', ':'))
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Timing-safe comparison
    return hmac.compare_digest(signature, expected_signature)

@app.route('/webhooks/payment', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Webhook-Signature')
    event = request.headers.get('X-Webhook-Event')
    payload = request.json
    
    # Verify signature
    if not verify_webhook_signature(payload, signature, WEBHOOK_SECRET):
        print('Invalid webhook signature')
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Process webhook
    payment_request = payload['paymentRequest']
    print(f"Webhook received: {event} for payment {payment_request['id']}")
    
    # Handle different events
    if event == 'payment.paid':
        print(f"Payment {payment_request['id']} has been paid!")
        # Update your database, send confirmation email, etc.
    elif event == 'payment.cancelled':
        print(f"Payment {payment_request['id']} was cancelled")
        # Handle cancellation
    elif event == 'payment.failed':
        print(f"Payment {payment_request['id']} failed")
        # Handle failure
    
    # Respond quickly (within 10 seconds)
    return jsonify({'received': True}), 200

if __name__ == '__main__':
    app.run(port=3000)
```

#### PHP Example

```php
<?php

// Your webhook secret (contact support to get your secret)
$webhookSecret = getenv('WEBHOOK_SECRET');

function verifyWebhookSignature($payload, $signature, $secret) {
    $payloadString = json_encode($payload);
    $expectedSignature = hash_hmac('sha256', $payloadString, $secret);
    
    // Timing-safe comparison
    return hash_equals($signature, $expectedSignature);
}

// Get headers
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';
$event = $_SERVER['HTTP_X_WEBHOOK_EVENT'] ?? '';

// Get payload
$payload = json_decode(file_get_contents('php://input'), true);

// Verify signature
if (!verifyWebhookSignature($payload, $signature, $webhookSecret)) {
    error_log('Invalid webhook signature');
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Process webhook
$paymentRequest = $payload['paymentRequest'];
error_log("Webhook received: {$event} for payment {$paymentRequest['id']}");

// Handle different events
switch ($event) {
    case 'payment.paid':
        error_log("Payment {$paymentRequest['id']} has been paid!");
        // Update your database, send confirmation email, etc.
        break;
    
    case 'payment.cancelled':
        error_log("Payment {$paymentRequest['id']} was cancelled");
        // Handle cancellation
        break;
    
    case 'payment.failed':
        error_log("Payment {$paymentRequest['id']} failed");
        // Handle failure
        break;
}

// Respond quickly (within 10 seconds)
http_response_code(200);
echo json_encode(['received' => true]);
?>
```

### Retry Logic

If your webhook endpoint is unreachable or returns a non-2xx status code, we'll automatically retry with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 1 second |
| 3 | 4 seconds |
| 4 | 9 seconds (final) |

After 4 failed attempts, we'll stop retrying. You can view webhook delivery logs in your merchant dashboard.

### Webhook Best Practices

1. ✅ **Respond Quickly**
   - Return a `200 OK` response within 10 seconds
   - Process the webhook asynchronously (use a queue if needed)
   - Don't perform long-running tasks in the webhook handler

2. ✅ **Verify Signature**
   - Always verify the `X-Webhook-Signature` header
   - Use timing-safe comparison to prevent timing attacks
   - Keep your webhook secret secure

3. ✅ **Handle Duplicates**
   - Use `paymentRequest.id` to detect duplicate events
   - Implement idempotent processing
   - Store processed webhook IDs in your database

4. ✅ **Use HTTPS**
   - Webhook URLs must use HTTPS in production
   - Use a valid SSL certificate
   - HTTP is allowed for local development only

5. ✅ **Handle All Events**
   - Don't assume you'll only receive certain events
   - Gracefully handle unknown event types
   - Log all webhook events for debugging

6. ✅ **Monitor and Log**
   - Log all webhook requests and responses
   - Set up alerts for failed webhooks
   - Monitor webhook delivery times

7. ✅ **Test Thoroughly**
   - Test with all event types
   - Test signature verification
   - Test retry scenarios
   - Use tools like [webhook.site](https://webhook.site) for testing

### Testing Webhooks Locally

Use a tunneling service to test webhooks on your local machine:

#### Using ngrok

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000

# Use the HTTPS URL as your callbackUrl:
# https://abc123.ngrok.io/webhooks/payment
```

#### Using localhost.run

```bash
# No installation needed
ssh -R 80:localhost:3000 localhost.run

# Use the provided URL as your callbackUrl
```

### Webhook Endpoint Requirements

Your webhook endpoint must:
- Accept POST requests
- Return a 2xx status code within 10 seconds
- Use HTTPS in production
- Verify the webhook signature
- Be publicly accessible (not behind authentication)

### Getting Your Webhook Secret

Contact our support team at support@pspplatform.com to receive your webhook secret. This secret is unique to your merchant account and used to generate webhook signatures.

## Support

For API support, please contact:
- Email: support@pspplatform.com
- Documentation: https://api.yourplatform.com/api/docs

## Changelog

### Version 1.0.0 (2024-10-30)
- Initial release
- Payment request creation (bank wire and card)
- Payment request listing and retrieval
- Payment request cancellation
- API key authentication
- Rate limiting
- Swagger/OpenAPI documentation

