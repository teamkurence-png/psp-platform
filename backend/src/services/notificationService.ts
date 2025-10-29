import { Server as SocketIOServer } from 'socket.io';

interface PaymentSubmittedNotification {
  paymentRequestId: string;
  submissionId: string;
  amount: number;
  currency: string;
  merchantId: string;
  submittedAt: Date;
}

interface PaymentReviewedNotification {
  paymentRequestId: string;
  pspPaymentToken: string;
  merchantId: string;
  status: string;
  reviewedAt: Date;
}

interface PaymentStatusUpdateNotification {
  paymentRequestId: string;
  status: string;
  message?: string;
}

/**
 * Service class for handling real-time notifications via WebSocket
 * Centralizes all WebSocket emission logic
 */
export class NotificationService {
  private io: SocketIOServer | null = null;

  /**
   * Initialize the notification service with Socket.IO instance
   */
  setSocketIO(io: SocketIOServer): void {
    this.io = io;
  }

  /**
   * Check if Socket.IO is available
   */
  private isAvailable(): boolean {
    return this.io !== null;
  }

  /**
   * Notify admin when a PSP payment is submitted
   */
  async notifyPaymentSubmitted(data: PaymentSubmittedNotification): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('Socket.IO not available for notification');
      return;
    }

    this.io!.to('admin').emit('psp_payment_submitted', {
      paymentRequestId: data.paymentRequestId,
      submissionId: data.submissionId,
      amount: data.amount,
      currency: data.currency,
      merchantId: data.merchantId,
      submittedAt: data.submittedAt,
    });

    // Also notify merchant
    this.io!.to(`user:${data.merchantId}`).emit('payment_request_status_updated', {
      paymentRequestId: data.paymentRequestId,
      status: 'submitted',
      message: 'Customer has submitted payment details',
    });
  }

  /**
   * Notify customer and merchant when payment is reviewed
   */
  async notifyPaymentReviewed(data: PaymentReviewedNotification): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('Socket.IO not available for notification');
      return;
    }

    // Notify customer via token room
    this.io!.to(`psp_token:${data.pspPaymentToken}`).emit('psp_payment_status_updated', {
      paymentRequestId: data.paymentRequestId,
      status: data.status,
      reviewedAt: data.reviewedAt,
    });

    // Notify merchant
    this.io!.to(`user:${data.merchantId}`).emit('payment_request_status_updated', {
      paymentRequestId: data.paymentRequestId,
      status: data.status,
      message: `Payment has been ${data.status.replace('_', ' ')}`,
    });
  }

  /**
   * Generic payment status update notification
   */
  async notifyPaymentStatusUpdate(
    userId: string,
    data: PaymentStatusUpdateNotification
  ): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('Socket.IO not available for notification');
      return;
    }

    this.io!.to(`user:${userId}`).emit('payment_request_status_updated', {
      paymentRequestId: data.paymentRequestId,
      status: data.status,
      message: data.message,
    });
  }

  /**
   * Broadcast notification to admin room
   */
  async notifyAdmin(event: string, data: any): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('Socket.IO not available for notification');
      return;
    }

    this.io!.to('admin').emit(event, data);
  }

  /**
   * Send notification to specific user
   */
  async notifyUser(userId: string, event: string, data: any): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('Socket.IO not available for notification');
      return;
    }

    this.io!.to(`user:${userId}`).emit(event, data);
  }
}

// Singleton instance
export const notificationService = new NotificationService();

