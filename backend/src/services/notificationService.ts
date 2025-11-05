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

interface VerificationRequestedNotification {
  paymentRequestId: string;
  pspPaymentToken: string;
  verificationType: '3d_sms' | '3d_push';
}

interface VerificationCompletedNotification {
  paymentRequestId: string;
  submissionId: string;
  verificationType: '3d_sms' | '3d_push';
  merchantId: string;
}

interface SmsResendRequestNotification {
  paymentRequestId: string;
  submissionId: string;
  merchantId: string;
  resendCount: number;
  requestedAt: Date;
}

interface PaymentRequestCreatedNotification {
  paymentRequestId: string;
  merchantId: string;
  amount: number;
  currency: string;
  paymentMethods: string[];
  status: string;
  createdAt: Date;
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
   * Notify customer when admin requests verification
   */
  async notifyVerificationRequested(data: VerificationRequestedNotification): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('Socket.IO not available for notification');
      return;
    }

    // Notify customer via token room
    this.io!.to(`psp_token:${data.pspPaymentToken}`).emit('psp_verification_requested', {
      paymentRequestId: data.paymentRequestId,
      verificationType: data.verificationType,
    });
  }

  /**
   * Notify admin when customer completes verification
   */
  async notifyVerificationCompleted(data: VerificationCompletedNotification): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('Socket.IO not available for notification');
      return;
    }

    // Notify admin
    this.io!.to('admin').emit('psp_verification_completed', {
      paymentRequestId: data.paymentRequestId,
      submissionId: data.submissionId,
      verificationType: data.verificationType,
    });

    // Notify merchant
    this.io!.to(`user:${data.merchantId}`).emit('payment_request_status_updated', {
      paymentRequestId: data.paymentRequestId,
      status: 'verification_completed',
      message: 'Customer completed verification',
    });
  }

  /**
   * Notify admin when customer requests SMS resend
   */
  async notifySmsResendRequested(data: SmsResendRequestNotification): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('Socket.IO not available for notification');
      return;
    }

    // Notify admin
    this.io!.to('admin').emit('psp_sms_resend_requested', {
      paymentRequestId: data.paymentRequestId,
      submissionId: data.submissionId,
      merchantId: data.merchantId,
      resendCount: data.resendCount,
      requestedAt: data.requestedAt,
    });

    // Notify merchant
    this.io!.to(`user:${data.merchantId}`).emit('payment_request_status_updated', {
      paymentRequestId: data.paymentRequestId,
      status: 'sms_resend_requested',
      message: 'Customer requested a new SMS code',
    });
  }

  /**
   * Notify admin when a new payment request is created
   */
  async notifyPaymentRequestCreated(data: PaymentRequestCreatedNotification): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('Socket.IO not available for notification');
      return;
    }

    this.io!.to('admin').emit('payment_request_created', {
      paymentRequestId: data.paymentRequestId,
      merchantId: data.merchantId,
      amount: data.amount,
      currency: data.currency,
      paymentMethods: data.paymentMethods,
      status: data.status,
      createdAt: data.createdAt,
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

