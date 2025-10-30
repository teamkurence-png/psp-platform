import crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import { WebhookLog } from '../models/WebhookLog.js';
import { IPaymentRequest } from '../models/PaymentRequest.js';

export interface WebhookPayload {
  event: string;
  paymentRequest: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    invoiceNumber: string;
    description: string;
    customerReference?: string;
    commissionAmount?: number;
    netAmount?: number;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  timestamp: string;
}

export class WebhookService {
  private readonly maxRetries = 3;
  private readonly timeoutMs = 10000; // 10 seconds
  private readonly webhookSecret: string;

  constructor() {
    // Use environment variable for webhook secret
    this.webhookSecret = process.env.WEBHOOK_SECRET || 'your-webhook-secret-key-change-in-production';
    
    if (this.webhookSecret === 'your-webhook-secret-key-change-in-production') {
      console.warn('⚠️  WARNING: Using default webhook secret. Set WEBHOOK_SECRET environment variable for production!');
    }
  }

  /**
   * Generate HMAC SHA256 signature for webhook payload
   * Merchants can verify this signature to ensure webhook is from your platform
   */
  private generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Send webhook notification to merchant's callback URL
   */
  async sendWebhook(
    paymentRequest: IPaymentRequest,
    event: string,
    attempt: number = 1
  ): Promise<boolean> {
    if (!paymentRequest.callbackUrl) {
      return false; // No callback URL configured
    }

    const payload: WebhookPayload = {
      event,
      paymentRequest: {
        id: (paymentRequest._id as any).toString(),
        status: paymentRequest.status,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        invoiceNumber: paymentRequest.invoiceNumber,
        description: paymentRequest.description,
        customerReference: paymentRequest.customerReference,
        commissionAmount: paymentRequest.commissionAmount,
        netAmount: paymentRequest.netAmount,
        paidAt: paymentRequest.paidAt,
        createdAt: paymentRequest.createdAt,
        updatedAt: paymentRequest.updatedAt,
      },
      timestamp: new Date().toISOString(),
    };

    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(payloadString);

    try {
      const response = await axios.post(paymentRequest.callbackUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'User-Agent': 'PSP-Platform-Webhook/1.0',
        },
        timeout: this.timeoutMs,
        validateStatus: (status) => status >= 200 && status < 300,
      });

      // Log successful webhook delivery
      await WebhookLog.create({
        paymentRequestId: paymentRequest._id,
        url: paymentRequest.callbackUrl,
        event,
        payload,
        response: response.data,
        statusCode: response.status,
        success: true,
        attempt,
      });

      console.log(`✅ Webhook delivered successfully to ${paymentRequest.callbackUrl} (attempt ${attempt})`);
      return true;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;
      const errorMessage = axiosError.message || 'Unknown error';

      // Log failed webhook delivery
      await WebhookLog.create({
        paymentRequestId: paymentRequest._id,
        url: paymentRequest.callbackUrl,
        event,
        payload,
        response: axiosError.response?.data,
        statusCode,
        success: false,
        attempt,
        error: errorMessage,
      });

      console.error(`❌ Webhook delivery failed to ${paymentRequest.callbackUrl} (attempt ${attempt}): ${errorMessage}`);

      // Retry logic
      if (attempt < this.maxRetries) {
        const delay = this.getRetryDelay(attempt);
        console.log(`⏳ Retrying webhook in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
        
        // Schedule retry with exponential backoff
        setTimeout(() => {
          this.sendWebhook(paymentRequest, event, attempt + 1).catch(err => {
            console.error('Webhook retry error:', err);
          });
        }, delay);
      }

      return false;
    }
  }

  /**
   * Exponential backoff for retries
   * Attempt 1: 1 second
   * Attempt 2: 4 seconds
   * Attempt 3: 9 seconds
   */
  private getRetryDelay(attempt: number): number {
    return Math.pow(attempt, 2) * 1000;
  }

  /**
   * Trigger webhook for payment status change
   */
  async notifyPaymentStatusChange(paymentRequest: IPaymentRequest): Promise<void> {
    const event = `payment.${paymentRequest.status}`;
    await this.sendWebhook(paymentRequest, event);
  }

  /**
   * Verify webhook signature (for documentation/testing)
   * Merchants will use this logic on their end
   */
  verifySignature(payload: string, signature: string): boolean {
    const expectedSignature = this.generateSignature(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get webhook logs for a payment request
   */
  async getWebhookLogs(paymentRequestId: string, limit: number = 10) {
    return WebhookLog.find({ paymentRequestId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get webhook delivery statistics
   */
  async getWebhookStats(paymentRequestId: string) {
    const logs = await WebhookLog.find({ paymentRequestId });
    
    return {
      total: logs.length,
      successful: logs.filter(log => log.success).length,
      failed: logs.filter(log => !log.success).length,
      lastAttempt: logs[0]?.createdAt,
    };
  }
}

// Export singleton instance
export const webhookService = new WebhookService();

