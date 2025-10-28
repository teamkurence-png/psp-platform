import mongoose, { Document, Schema } from 'mongoose';

export interface IContactSubmission extends Document {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSubmissionSchema = new Schema<IContactSubmission>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
contactSubmissionSchema.index({ createdAt: -1 });
contactSubmissionSchema.index({ email: 1 });

export const ContactSubmission = mongoose.model<IContactSubmission>(
  'ContactSubmission',
  contactSubmissionSchema
);

