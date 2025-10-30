import { Request } from 'express';
import { z } from 'zod';
import { PaymentMethod } from './index.js';

// API Key related types
export interface ApiKeyInfo {
  id: string;
  userId: string;
  prefix: string;
  name: string;
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyMetadata {
  prefix: string;
  name: string;
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
}

export interface ApiKeyWithToken extends ApiKeyInfo {
  fullKey: string; // Only returned once during creation
}

// API Request types
export interface ApiAuthRequest extends Request {
  apiKey?: {
    id: string;
    userId: string;
    permissions: string[];
  };
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// API Payment Request types
export interface ApiPaymentRequestInput {
  amount: number;
  currency?: string;
  description: string;
  invoiceNumber: string;
  dueDate: string;
  customerReference?: string;
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
    billingCountry: string;
  };
  paymentMethods: ('bank_wire' | 'card')[];
}

export interface ApiPaymentRequestResponse {
  id: string;
  amount: number;
  currency: string;
  description: string;
  invoiceNumber: string;
  dueDate: string;
  status: string;
  paymentMethods: PaymentMethod[];
  paymentLink?: string; // For card payments
  bankDetails?: {
    rails: string[];
    beneficiaryName?: string;
    iban?: string;
    accountNumber?: string;
    routingNumber?: string;
    swiftCode?: string;
    bankName?: string;
    bankAddress?: string;
  };
  reason?: string; // Payment reference for bank wire
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
    billingCountry: string;
  };
  commissionPercent?: number;
  commissionAmount?: number;
  netAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiListResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Validation Schemas
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  expiresAt: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

export const apiPaymentRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  invoiceNumber: z.string().min(1, 'Invoice number is required').max(100, 'Invoice number too long'),
  dueDate: z.string().min(1, 'Due date is required').transform((val) => {
    if (val.includes('T')) return val;
    return new Date(val).toISOString();
  }),
  customerReference: z.string().max(100).optional(),
  customerInfo: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    billingCountry: z.string().min(1, 'Customer billing country is required').max(3, 'Use ISO country code'),
  }),
  paymentMethods: z.array(z.enum(['bank_wire', 'card'])).min(1, 'At least one payment method is required'),
}).superRefine((data, ctx) => {
  // For bank wire transfers, require all customer info fields
  if (data.paymentMethods.includes('bank_wire' as PaymentMethod)) {
    if (!data.customerInfo.name || data.customerInfo.name.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Customer name is required for bank wire transfers',
        path: ['customerInfo', 'name'],
      });
    }
    if (!data.customerInfo.email || data.customerInfo.email.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Customer email is required for bank wire transfers',
        path: ['customerInfo', 'email'],
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerInfo.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valid customer email is required for bank wire transfers',
        path: ['customerInfo', 'email'],
      });
    }
    if (!data.customerInfo.phone || data.customerInfo.phone.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Customer phone is required for bank wire transfers',
        path: ['customerInfo', 'phone'],
      });
    }
  }
  // For card payments, validate email format if provided
  if (data.paymentMethods.includes('card' as PaymentMethod) && data.customerInfo.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerInfo.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valid customer email is required',
        path: ['customerInfo', 'email'],
      });
    }
  }
});

