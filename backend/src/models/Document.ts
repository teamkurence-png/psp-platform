import mongoose, { Document as MongooseDocument, Schema } from 'mongoose';
import { DocumentType } from '../types/index.js';

export interface IDocument extends MongooseDocument {
  merchantId: mongoose.Types.ObjectId;
  type: DocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(DocumentType),
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (merchantId already indexed via ref)
documentSchema.index({ type: 1 });
documentSchema.index({ status: 1 });

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);

