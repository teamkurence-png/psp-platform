import mongoose, { Document, Schema } from 'mongoose';
import { CommissionStatus } from '../types/index.js';

export interface ICommission extends Document {
  userId: mongoose.Types.ObjectId; // The merchant leader who earns the commission
  merchantId: mongoose.Types.ObjectId; // The merchant who generated the payment
  paymentRequestId: mongoose.Types.ObjectId; // The payment request that generated this commission
  amount: number; // Commission amount (5% of payment)
  paymentAmount: number; // Original payment amount for reference
  currency: string;
  status: CommissionStatus;
  creditedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const commissionSchema = new Schema<ICommission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    paymentRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentRequest',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: Object.values(CommissionStatus),
      default: CommissionStatus.PENDING,
    },
    creditedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
commissionSchema.index({ userId: 1, status: 1 });
commissionSchema.index({ merchantId: 1, createdAt: -1 });
commissionSchema.index({ createdAt: -1 });

export const Commission = mongoose.model<ICommission>('Commission', commissionSchema);

