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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
bankAccountSchema.index({ isActive: 1 });
bankAccountSchema.index({ bankName: 1 });
bankAccountSchema.index({ supportedGeos: 1 }); // For efficient geo-based queries

export const BankAccount = mongoose.model<IBankAccount>('BankAccount', bankAccountSchema);

