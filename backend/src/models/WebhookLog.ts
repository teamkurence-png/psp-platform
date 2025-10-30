import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhookLog extends Document {
  paymentRequestId: mongoose.Types.ObjectId;
  url: string;
  event: string;
  payload: object;
  response?: object;
  statusCode?: number;
  success: boolean;
  attempt: number;
  error?: string;
  createdAt: Date;
}

const webhookLogSchema = new Schema<IWebhookLog>(
  {
    paymentRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentRequest',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    event: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    response: {
      type: Schema.Types.Mixed,
    },
    statusCode: Number,
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
    attempt: {
      type: Number,
      required: true,
      default: 1,
    },
    error: String,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
webhookLogSchema.index({ paymentRequestId: 1, createdAt: -1 });
webhookLogSchema.index({ success: 1, createdAt: -1 });

export const WebhookLog = mongoose.model<IWebhookLog>('WebhookLog', webhookLogSchema);

