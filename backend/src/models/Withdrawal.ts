import mongoose, { Document, Schema } from 'mongoose';
import { CryptoAsset, WithdrawalStatus } from '../types/index.js';

export interface IWithdrawal extends Document {
  userId: mongoose.Types.ObjectId;
  method: 'crypto' | 'bank_transfer';
  amount: number;
  currency: string;
  fee: number;
  netAmount: number;
  status: WithdrawalStatus;
  
  // Crypto-specific fields
  asset?: CryptoAsset;
  network?: string;
  address?: string;
  txHash?: string;
  confirmations?: number;
  explorerUrl?: string;
  
  // Bank transfer-specific fields
  bankAccount?: string;
  iban?: string;
  swiftCode?: string;
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
  beneficiaryName?: string;
  
  // Common fields
  transactionIds?: mongoose.Types.ObjectId[];
  failureReason?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    method: {
      type: String,
      enum: ['crypto', 'bank_transfer'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    fee: {
      type: Number,
      default: 0,
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
    
    // Crypto-specific fields
    asset: {
      type: String,
      enum: Object.values(CryptoAsset),
    },
    network: String,
    address: String,
    txHash: String,
    confirmations: {
      type: Number,
      default: 0,
    },
    explorerUrl: String,
    
    // Bank transfer-specific fields
    bankAccount: String,
    iban: String,
    swiftCode: String,
    accountNumber: String,
    routingNumber: String,
    bankName: String,
    beneficiaryName: String,
    
    // Common fields
    transactionIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    }],
    failureReason: String,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ createdAt: -1 });
withdrawalSchema.index({ userId: 1, status: 1 }); // Compound index for queries

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);

