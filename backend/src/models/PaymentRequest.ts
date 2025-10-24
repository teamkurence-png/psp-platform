import mongoose, { Document, Schema } from 'mongoose';
import { PaymentMethod, PaymentRequestStatus, BankRail } from '../types/index.js';

export interface ICustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
  billingCountry?: string;
}

export interface IBankDetails {
  rails: BankRail[];
  beneficiaryName?: string;
  iban?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  bankName?: string;
  bankAddress?: string;
}

export interface ICardSettings {
  allowedBrands?: string[];
  require3DS: boolean;
  expiryDate?: Date;
}

export interface IPaymentRequest extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  description?: string;
  invoiceNumber?: string;
  dueDate?: Date;
  customerReference?: string;
  customerInfo?: ICustomerInfo;
  paymentMethods: PaymentMethod[];
  status: PaymentRequestStatus;
  referenceCode?: string;
  checkoutUrl?: string;
  bankAccountId?: mongoose.Types.ObjectId;
  cardId?: mongoose.Types.ObjectId;
  bankDetails?: IBankDetails;
  cardSettings?: ICardSettings;
  viewedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const customerInfoSchema = new Schema<ICustomerInfo>({
  name: String,
  email: String,
  phone: String,
  billingCountry: String,
}, { _id: false });

const bankDetailsSchema = new Schema<IBankDetails>({
  rails: [{ type: String, enum: Object.values(BankRail) }],
  beneficiaryName: String,
  iban: String,
  accountNumber: String,
  routingNumber: String,
  swiftCode: String,
  bankName: String,
  bankAddress: String,
}, { _id: false });

const cardSettingsSchema = new Schema<ICardSettings>({
  allowedBrands: [String],
  require3DS: { type: Boolean, default: false },
  expiryDate: Date,
}, { _id: false });

const paymentRequestSchema = new Schema<IPaymentRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
    description: String,
    invoiceNumber: String,
    dueDate: Date,
    customerReference: String,
    customerInfo: customerInfoSchema,
    paymentMethods: {
      type: [String],
      enum: Object.values(PaymentMethod),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentRequestStatus),
      default: PaymentRequestStatus.SENT,
    },
    referenceCode: String,
    checkoutUrl: String,
    bankAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'BankAccount',
    },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'Card',
    },
    bankDetails: bankDetailsSchema,
    cardSettings: cardSettingsSchema,
    viewedAt: Date,
    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentRequestSchema.index({ status: 1 });
paymentRequestSchema.index({ referenceCode: 1 });
paymentRequestSchema.index({ createdAt: -1 });
paymentRequestSchema.index({ userId: 1, status: 1 }); // Compound index for queries

export const PaymentRequest = mongoose.model<IPaymentRequest>('PaymentRequest', paymentRequestSchema);

