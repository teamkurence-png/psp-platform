import mongoose, { Document, Schema } from 'mongoose';

export interface IApiKey extends Document {
  userId: mongoose.Types.ObjectId;
  key: string; // Hashed API key
  prefix: string; // First 8 chars for display (e.g., "psp_live")
  name: string; // User-friendly label
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  permissions: string[]; // Future scope control
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
    },
    prefix: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    permissions: {
      type: [String],
      default: ['payment_requests:read', 'payment_requests:write'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
apiKeySchema.index({ userId: 1, isActive: 1 });
apiKeySchema.index({ prefix: 1, isActive: 1 });

export const ApiKey = mongoose.model<IApiKey>('ApiKey', apiKeySchema);

