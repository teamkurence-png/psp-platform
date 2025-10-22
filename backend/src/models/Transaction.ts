import mongoose, { Document, Schema } from 'mongoose';
import { PaymentMethod, TransactionStatus, MerchantConfirmation } from '../types/index.js';

export interface ICardDetails {
  brand?: string;
  bin?: string;
  last4?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardholderName?: string;
}

export interface IBankWireDetails {
  iban?: string;
  senderName?: string;
  senderBank?: string;
  confirmationStatus: MerchantConfirmation;
  proofFilePath?: string;
  receivedDate?: Date;
  referenceNumber?: string;
}

export interface IRiskSignals {
  ipAddress?: string;
  deviceFingerprint?: string;
  velocityScore?: number;
  blacklistMatches?: string[];
}

export interface ITimelineEvent {
  event: string;
  timestamp: Date;
  actor?: string;
  notes?: string;
}

export interface ITransaction extends Document {
  transactionId: string;
  paymentRequestId?: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
  };
  method: PaymentMethod;
  amount: number;
  currency: string;
  fees: number;
  net: number;
  merchantConfirmation: MerchantConfirmation;
  platformStatus: TransactionStatus;
  riskScore: number;
  cardDetails?: ICardDetails;
  bankWireDetails?: IBankWireDetails;
  timeline: ITimelineEvent[];
  notes: Array<{
    text: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
  attachments: Array<{
    fileName: string;
    filePath: string;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
  }>;
  riskSignals?: IRiskSignals;
  refunded: boolean;
  refundAmount?: number;
  refundedAt?: Date;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cardDetailsSchema = new Schema<ICardDetails>({
  brand: String,
  bin: String,
  last4: String,
  expiryMonth: String,
  expiryYear: String,
  cardholderName: String,
}, { _id: false });

const bankWireDetailsSchema = new Schema<IBankWireDetails>({
  iban: String,
  senderName: String,
  senderBank: String,
  confirmationStatus: {
    type: String,
    enum: Object.values(MerchantConfirmation),
    default: MerchantConfirmation.PENDING,
  },
  proofFilePath: String,
  receivedDate: Date,
  referenceNumber: String,
}, { _id: false });

const riskSignalsSchema = new Schema<IRiskSignals>({
  ipAddress: String,
  deviceFingerprint: String,
  velocityScore: Number,
  blacklistMatches: [String],
}, { _id: false });

const timelineEventSchema = new Schema<ITimelineEvent>({
  event: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actor: String,
  notes: String,
}, { _id: false });

const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentRequest',
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    customerInfo: {
      name: String,
      email: String,
      phone: String,
      country: String,
    },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
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
    fees: {
      type: Number,
      default: 0,
    },
    net: {
      type: Number,
      required: true,
    },
    merchantConfirmation: {
      type: String,
      enum: Object.values(MerchantConfirmation),
      default: MerchantConfirmation.PENDING,
    },
    platformStatus: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING_REVIEW,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    cardDetails: cardDetailsSchema,
    bankWireDetails: bankWireDetailsSchema,
    timeline: [timelineEventSchema],
    notes: [{
      text: String,
      createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
    }],
    attachments: [{
      fileName: String,
      filePath: String,
      uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      uploadedAt: { type: Date, default: Date.now },
    }],
    riskSignals: riskSignalsSchema,
    refunded: {
      type: Boolean,
      default: false,
    },
    refundAmount: Number,
    refundedAt: Date,
    settledAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
// transactionId index is automatic due to unique: true
transactionSchema.index({ platformStatus: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ 'customerInfo.email': 1 });
transactionSchema.index({ merchantId: 1, platformStatus: 1 }); // Compound index for queries

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);

