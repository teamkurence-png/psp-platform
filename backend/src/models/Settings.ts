import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  value: any;
  encrypted: boolean;
  category: 'gateway' | 'bank' | 'crypto' | 'notification' | 'general';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    encrypted: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: ['gateway', 'bank', 'crypto', 'notification', 'general'],
      default: 'general',
    },
    description: String,
  },
  {
    timestamps: true,
  }
);

// Indexes (key already indexed via unique: true)
settingsSchema.index({ category: 1 });

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);

