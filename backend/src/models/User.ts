import mongoose, { Document, Schema } from 'mongoose';
import { UserRole, OnboardingStatus } from '../types/index.js';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  refreshToken?: string;
  lastLogin?: Date;
  // Merchant-specific fields (only populated when role is MERCHANT)
  legalName?: string;
  dba?: string;
  registrationNumber?: string;
  website?: string;
  industry?: string;
  address?: IAddress;
  phone?: string;
  supportEmail?: string;
  telegram?: string;
  onboardingStatus?: OnboardingStatus;
  rejectionReason?: string;
  approvedAt?: Date;
  // Merchant leader fields
  isMerchantLeader?: boolean;
  merchantLeaderId?: mongoose.Types.ObjectId;
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

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.MERCHANT,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    twoFactorSecret: {
      type: String,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
    // Merchant-specific fields
    legalName: String,
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
    // Merchant leader fields
    isMerchantLeader: {
      type: Boolean,
      default: false,
    },
    merchantLeaderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: email index is already created via unique: true in schema
userSchema.index({ onboardingStatus: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ isMerchantLeader: 1 });
userSchema.index({ merchantLeaderId: 1 });

export const User = mongoose.model<IUser>('User', userSchema);

