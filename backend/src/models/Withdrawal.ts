import mongoose, { Document, Schema } from 'mongoose';
import { CryptoAsset, WithdrawalStatus } from '../types/index.js';

export interface IWithdrawal extends Document {
  merchantId: mongoose.Types.ObjectId;
  asset: CryptoAsset;
  network: string;
  address: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: WithdrawalStatus;
  txHash?: string;
  confirmations?: number;
  explorerUrl?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    asset: {
      type: String,
      enum: Object.values(CryptoAsset),
      required: true,
    },
    network: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    fee: {
      type: Number,
      required: true,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(WithdrawalStatus),
      default: WithdrawalStatus.INITIATED,
    },
    txHash: String,
    confirmations: {
      type: Number,
      default: 0,
    },
    explorerUrl: String,
    failureReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ createdAt: -1 });
withdrawalSchema.index({ merchantId: 1, status: 1 }); // Compound index for queries

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);

