import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  merchantId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  riskFlags: string[];
  notes: Array<{
    text: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
  totalTransactions: number;
  totalVolume: number;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: String,
    country: String,
    riskFlags: [String],
    notes: [{
      text: String,
      createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
    }],
    totalTransactions: {
      type: Number,
      default: 0,
    },
    totalVolume: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (compound unique index also covers merchantId and email individually)
customerSchema.index({ merchantId: 1, email: 1 }, { unique: true });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);

