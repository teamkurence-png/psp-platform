import mongoose, { Document, Schema } from 'mongoose';

export interface ICard extends Document {
  name: string;
  pspLink: string;
  commissionPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const cardSchema = new Schema<ICard>(
  {
    name: {
      type: String,
      required: true,
    },
    pspLink: {
      type: String,
      required: true,
    },
    commissionPercent: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Commission percent must be at least 0'],
      max: [100, 'Commission percent must not exceed 100'],
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
cardSchema.index({ isActive: 1 });
cardSchema.index({ name: 1 });

export const Card = mongoose.model<ICard>('Card', cardSchema);

