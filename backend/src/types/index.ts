import { Request } from 'express';
import { Types } from 'mongoose';

export enum UserRole {
  MERCHANT = 'merchant',
  OPS = 'ops',
  FINANCE = 'finance',
  ADMIN = 'admin',
}

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PaymentMethod {
  BANK_WIRE = 'bank_wire',
  CARD = 'card',
}

export enum PaymentRequestStatus {
  SENT = 'sent',
  VIEWED = 'viewed',
  PENDING_SUBMISSION = 'pending_submission',
  SUBMITTED = 'submitted',
  AWAITING_3D_SMS = 'awaiting_3d_sms',
  AWAITING_3D_PUSH = 'awaiting_3d_push',
  VERIFICATION_COMPLETED = 'verification_completed',
  PROCESSED_AWAITING_EXCHANGE = 'processed_awaiting_exchange',
  PROCESSED = 'processed',
  REJECTED = 'rejected',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  FAILED = 'failed',
  PAID = 'paid',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum WithdrawalStatus {
  INITIATED = 'initiated',
  ON_CHAIN = 'on_chain',
  PAID = 'paid',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export enum CryptoAsset {
  USDT_TRC20 = 'usdt_trc20',
  USDT_ERC20 = 'usdt_erc20',
  BTC = 'btc',
  ETH = 'eth',
}

export enum BankRail {
  SEPA = 'sepa',
  SWIFT = 'swift',
  LOCAL = 'local',
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

