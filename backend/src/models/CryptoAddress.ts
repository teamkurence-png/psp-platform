import mongoose, { Document, Schema } from 'mongoose';
import { CryptoAsset } from '../types/index.js';

export interface ICryptoAddress extends Document {
  userId: mongoose.Types.ObjectId;
  asset: CryptoAsset;
  network: string;
  address: string;
  label?: string;
  whitelisted: boolean;
  whitelistedAt?: Date;
  coolingPeriodEnds?: Date;
  testSendCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const cryptoAddressSchema = new Schema<ICryptoAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
    label: String,
    whitelisted: {
      type: Boolean,
      default: false,
    },
    whitelistedAt: Date,
    coolingPeriodEnds: Date,
    testSendCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
cryptoAddressSchema.index({ asset: 1 });
cryptoAddressSchema.index({ whitelisted: 1 });
cryptoAddressSchema.index({ userId: 1, asset: 1 }); // Compound index for queries

export const CryptoAddress = mongoose.model<ICryptoAddress>('CryptoAddress', cryptoAddressSchema);

