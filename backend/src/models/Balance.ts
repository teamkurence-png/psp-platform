import mongoose, { Document, Schema } from 'mongoose';

export interface IPendingBalance {
  amount: number;
  currency: string;
  settleDate: Date;
}

export interface IBalance extends Document {
  userId: mongoose.Types.ObjectId;
  available: number;
  pending: number;
  commissionBalance: number;
  currency: string;
  pendingBreakdown: IPendingBalance[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pendingBalanceSchema = new Schema<IPendingBalance>({
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  settleDate: { type: Date, required: true },
}, { _id: false });

const balanceSchema = new Schema<IBalance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    available: {
      type: Number,
      default: 0,
    },
    pending: {
      type: Number,
      default: 0,
    },
    commissionBalance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    pendingBreakdown: [pendingBalanceSchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Note: userId index already created via unique: true

export const Balance = mongoose.model<IBalance>('Balance', balanceSchema);

