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
  PAID = 'paid',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum TransactionStatus {
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SETTLED = 'settled',
}

export enum MerchantConfirmation {
  SUCCESS = 'success',
  FAILED = 'failed',
  NOT_RECEIVED = 'not_received',
  PENDING = 'pending',
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

export enum DocumentType {
  INCORPORATION = 'incorporation',
  BANK_LETTER = 'bank_letter',
  PROOF_OF_ADDRESS = 'proof_of_address',
  WEBSITE_SCREENSHOT = 'website_screenshot',
  PROCESSING_HISTORY = 'processing_history',
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
    merchantId?: string;
  };
}

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  merchantId?: string;
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

