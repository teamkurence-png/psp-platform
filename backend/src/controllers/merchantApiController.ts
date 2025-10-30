import { Response } from 'express';
import { z } from 'zod';
import { ApiAuthRequest, apiPaymentRequestSchema } from '../types/api.js';
import { merchantApiService } from '../services/merchantApiService.js';

/**
 * @swagger
 * /api/v1/merchant/payment-requests:
 *   post:
 *     summary: Create a payment request
 *     description: |
 *       Create a new payment request for bank wire, card, or both payment methods.
 *       
 *       **Bank Wire Transfer:**
 *       - For B2C, large amounts, invoices
 *       - Unlimited amount
 *       - Processing: 1-3 business days
 *       - Required: name, email, phone, billingCountry
 *       - Returns: Complete bank details + unique payment reference
 *       
 *       **Card Payment (PSP):**
 *       - For B2C, small amounts, subscriptions
 *       - Max $100000 USD
 *       - Processing: Real-time
 *       - Required: billingCountry only
 *       - Optional: name, email, phone (recommended)
 *       - Returns: Payment link for customer
 *       
 *       **Both Methods:**
 *       - Customer chooses preferred method
 *       - Returns both bank details and payment link
 *       - Amount must be ≤ $10000 USD
 *     tags: [Merchant API]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - description
 *               - invoiceNumber
 *               - dueDate
 *               - customerInfo
 *               - paymentMethods
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *                 example: 5000.00
 *               currency:
 *                 type: string
 *                 default: USD
 *                 example: USD
 *               description:
 *                 type: string
 *                 description: Payment description
 *                 example: Invoice payment for Q4 consulting services
 *               invoiceNumber:
 *                 type: string
 *                 description: Your invoice number
 *                 example: INV-2024-001
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Payment due date (YYYY-MM-DD)
 *                 example: 2024-12-31
 *               customerReference:
 *                 type: string
 *                 description: Optional reference for your records
 *                 example: CLIENT-ACME-2024
 *               customerInfo:
 *                 type: object
 *                 required:
 *                   - billingCountry
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Customer name (REQUIRED for bank wire)
 *                     example: John Smith
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Customer email (REQUIRED for bank wire)
 *                     example: john.smith@acmecorp.com
 *                   phone:
 *                     type: string
 *                     description: Customer phone (REQUIRED for bank wire)
 *                     example: +1-555-123-4567
 *                   billingCountry:
 *                     type: string
 *                     description: ISO country code (required for all methods)
 *                     example: US
 *               paymentMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [bank_wire, card]
 *                 description: Payment methods to accept
 *                 example: [bank_wire]
 *           examples:
 *             bankWire:
 *               summary: Bank Wire Transfer (B2C)
 *               value:
 *                 amount: 5000.00
 *                 currency: USD
 *                 description: Invoice payment for Q4 consulting services
 *                 invoiceNumber: INV-2024-001
 *                 dueDate: 2024-12-31
 *                 customerReference: CLIENT-ACME-2024
 *                 customerInfo:
 *                   name: John Smith
 *                   email: john.smith@acmecorp.com
 *                   phone: +1-555-123-4567
 *                   billingCountry: US
 *                 paymentMethods: [bank_wire]
 *             cardPayment:
 *               summary: Card Payment (B2C)
 *               value:
 *                 amount: 149.99
 *                 currency: USD
 *                 description: Premium subscription - Annual plan
 *                 invoiceNumber: INV-2024-SUB-789
 *                 dueDate: 2024-11-15
 *                 customerReference: USER-456
 *                 customerInfo:
 *                   name: Sarah Johnson
 *                   email: sarah.johnson@email.com
 *                   phone: +1-555-987-6543
 *                   billingCountry: US
 *                 paymentMethods: [card]
 *             bothMethods:
 *               summary: Both Methods (Flexible)
 *               value:
 *                 amount: 200.00
 *                 currency: USD
 *                 description: Invoice payment for web design services
 *                 invoiceNumber: INV-2024-WEB-101
 *                 dueDate: 2024-12-15
 *                 customerInfo:
 *                   name: Michael Chen
 *                   email: michael.chen@company.com
 *                   phone: +1-555-222-3333
 *                   billingCountry: US
 *                 paymentMethods: [bank_wire, card]
 *     responses:
 *       201:
 *         description: Payment request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaymentRequest'
 *             examples:
 *               bankWireResponse:
 *                 summary: Bank Wire Response
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 64f1a2b3c4d5e6f7g8h9i0j1
 *                     amount: 5000.00
 *                     currency: USD
 *                     description: Invoice payment for Q4 consulting services
 *                     invoiceNumber: INV-2024-001
 *                     status: sent
 *                     paymentMethods: [bank_wire]
 *                     bankDetails:
 *                       rails: [SWIFT]
 *                       beneficiaryName: Your Company LLC
 *                       iban: GB29NWBK60161331926819
 *                       swiftCode: BOFAUS3N
 *                       bankName: Bank of America
 *                       bankAddress: 123 Bank St, New York, NY 10001
 *                     reason: PAY-XYZ789DEF
 *                     commissionPercent: 2.5
 *                     commissionAmount: 125.00
 *                     netAmount: 4875.00
 *               cardPaymentResponse:
 *                 summary: Card Payment Response
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 64f1a2b3c4d5e6f7g8h9i0j2
 *                     amount: 149.99
 *                     currency: USD
 *                     description: Premium subscription - Annual plan
 *                     invoiceNumber: INV-2024-SUB-789
 *                     status: pending_submission
 *                     paymentMethods: [card]
 *                     paymentLink: https://pay.yourplatform.com/pay/abc123token456
 *                     commissionPercent: 3.5
 *                     commissionAmount: 5.25
 *                     netAmount: 144.74
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Card payments are limited to a maximum of $100000 USD
 *       401:
 *         description: Invalid or missing API key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid or expired API key
 */
export const createPaymentRequest = async (
  req: ApiAuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const validatedData = apiPaymentRequestSchema.parse(req.body);

    const paymentRequest = await merchantApiService.createPaymentRequest(
      req.user.id,
      validatedData
    );

    res.status(201).json({
      success: true,
      data: paymentRequest,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    console.error('Create payment request error:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment request' });
  }
};

/**
 * @swagger
 * /api/v1/merchant/payment-requests:
 *   get:
 *     summary: List payment requests
 *     description: Retrieve a list of your payment requests with optional filtering
 *     tags: [Merchant API]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: List of payment requests
 *       401:
 *         description: Invalid API key
 */
export const listPaymentRequests = async (
  req: ApiAuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { page, limit, status, startDate, endDate } = req.query;

    const result = await merchantApiService.listPaymentRequests(req.user.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('List payment requests error:', error);
    res.status(500).json({ success: false, error: 'Failed to list payment requests' });
  }
};

/**
 * @swagger
 * /api/v1/merchant/payment-requests/{id}:
 *   get:
 *     summary: Get payment request details
 *     description: Retrieve details of a specific payment request
 *     tags: [Merchant API]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment request ID
 *     responses:
 *       200:
 *         description: Payment request details
 *       404:
 *         description: Payment request not found
 *       401:
 *         description: Invalid API key
 */
export const getPaymentRequest = async (
  req: ApiAuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const paymentRequest = await merchantApiService.getPaymentRequest(id, req.user.id);

    if (!paymentRequest) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }

    res.json({
      success: true,
      data: paymentRequest,
    });
  } catch (error) {
    console.error('Get payment request error:', error);
    res.status(500).json({ success: false, error: 'Failed to get payment request' });
  }
};

/**
 * @swagger
 * /api/v1/merchant/payment-requests/{id}/cancel:
 *   post:
 *     summary: Cancel a payment request
 *     description: Cancel a payment request that has not been paid yet
 *     tags: [Merchant API]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment request ID
 *     responses:
 *       200:
 *         description: Payment request cancelled successfully
 *       404:
 *         description: Payment request not found
 *       401:
 *         description: Invalid API key
 */
export const cancelPaymentRequest = async (
  req: ApiAuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const paymentRequest = await merchantApiService.cancelPaymentRequest(id, req.user.id);

    if (!paymentRequest) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Payment request cancelled successfully',
      data: paymentRequest,
    });
  } catch (error) {
    console.error('Cancel payment request error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel payment request' });
  }
};

