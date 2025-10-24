import mongoose, { Document, Schema } from 'mongoose';

export interface ICard extends Document {
  name: string;
  pspLink: string;
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

