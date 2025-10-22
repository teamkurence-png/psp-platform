import mongoose, { Document, Schema } from 'mongoose';

export interface ISettlement extends Document {
  settlementId: string;
  merchantId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'crypto';
  destination: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionIds: mongoose.Types.ObjectId[];
  reconciliationFlags?: string[];
  failureReason?: string;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const settlementSchema = new Schema<ISettlement>(
  {
    settlementId: {
      type: String,
      required: true,
      unique: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    method: {
      type: String,
      enum: ['bank_transfer', 'crypto'],
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    transactionIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    }],
    reconciliationFlags: [String],
    failureReason: String,
    settledAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
// settlementId index is automatic due to unique: true
settlementSchema.index({ status: 1 });
settlementSchema.index({ createdAt: -1 });
settlementSchema.index({ merchantId: 1, status: 1 }); // Compound index for queries

export const Settlement = mongoose.model<ISettlement>('Settlement', settlementSchema);

