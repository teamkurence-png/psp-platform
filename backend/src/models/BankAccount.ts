import mongoose, { Document, Schema } from 'mongoose';

export interface IBankAccount extends Document {
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  bankAddress?: string;
  beneficiaryName?: string;
  supportedGeos: string[];
  minTransactionLimit: number;
  maxTransactionLimit: number;
  commissionPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bankAccountSchema = new Schema<IBankAccount>(
  {
    bankName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    routingNumber: String,
    swiftCode: String,
    iban: String,
    bankAddress: String,
    beneficiaryName: String,
    supportedGeos: {
      type: [String],
      required: true,
      default: [],
    },
    minTransactionLimit: {
      type: Number,
      required: true,
      min: [0, 'Minimum transaction limit must be at least 0'],
    },
    maxTransactionLimit: {
      type: Number,
      required: true,
      min: [0, 'Maximum transaction limit must be at least 0'],
    },
    commissionPercent: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Commission percent must be at least 0'],
      max: [100, 'Commission percent must not exceed 100'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validation: Ensure maxTransactionLimit >= minTransactionLimit
bankAccountSchema.pre('save', function(next) {
  if (this.maxTransactionLimit < this.minTransactionLimit) {
    next(new Error('Maximum transaction limit must be greater than or equal to minimum transaction limit'));
  } else {
    next();
  }
});

// Indexes
bankAccountSchema.index({ isActive: 1 });
bankAccountSchema.index({ bankName: 1 });
bankAccountSchema.index({ supportedGeos: 1 }); // For efficient geo-based queries

export const BankAccount = mongoose.model<IBankAccount>('BankAccount', bankAccountSchema);

