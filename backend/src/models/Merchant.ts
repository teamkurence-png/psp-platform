import mongoose, { Document, Schema } from 'mongoose';
import { OnboardingStatus } from '../types/index.js';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IMerchant extends Document {
  userId: mongoose.Types.ObjectId;
  legalName: string;
  dba?: string;
  registrationNumber?: string;
  website?: string;
  industry?: string;
  address?: IAddress;
  phone?: string;
  supportEmail?: string;
  telegram?: string;
  onboardingStatus: OnboardingStatus;
  rejectionReason?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>({
  street: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
}, { _id: false });

const merchantSchema = new Schema<IMerchant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    legalName: {
      type: String,
      required: true,
    },
    dba: String,
    registrationNumber: String,
    website: String,
    industry: String,
    address: addressSchema,
    phone: String,
    supportEmail: String,
    telegram: String,
    onboardingStatus: {
      type: String,
      enum: Object.values(OnboardingStatus),
      default: OnboardingStatus.NOT_STARTED,
    },
    rejectionReason: String,
    approvedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes (userId already indexed via unique: true)
merchantSchema.index({ onboardingStatus: 1 });

export const Merchant = mongoose.model<IMerchant>('Merchant', merchantSchema);

