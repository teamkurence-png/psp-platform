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

export interface User {
  id: string;
  email: string;
  role: UserRole;
  twoFactorEnabled: boolean;
  lastLogin?: string;
}

export interface Merchant {
  _id: string;
  userId: string;
  legalName: string;
  dba?: string;
  registrationNumber?: string;
  website?: string;
  industry?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phone?: string;
  supportEmail?: string;
  telegram?: string;
  onboardingStatus: OnboardingStatus;
  rejectionReason?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  _id: string;
  merchantId: string;
  amount: number;
  currency: string;
  description: string;
  invoiceNumber: string;
  dueDate: string;
  customerReference?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    billingCountry: string;
  };
  paymentMethods: PaymentMethod[];
  status: PaymentRequestStatus;
  reason?: string;
  checkoutUrl?: string;
  bankAccountId?: string;
  cardId?: string;
  bankDetails?: {
    rails: BankRail[];
    beneficiaryName?: string;
    iban?: string;
    accountNumber?: string;
    routingNumber?: string;
    swiftCode?: string;
    bankName?: string;
    bankAddress?: string;
  };
  cardSettings?: {
    allowedBrands?: string[];
    require3DS: boolean;
    expiryDate?: string;
  };
  viewedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Balance {
  _id: string;
  merchantId: string;
  available: number;
  pending: number;
  reserve: number;
  currency: string;
  pendingBreakdown: Array<{
    amount: number;
    currency: string;
    settleDate: string;
  }>;
  lastUpdated: string;
}

export interface DashboardStats {
  todayVolume: number;
  weekVolume: number;
  monthVolume: number;
  todayApprovals: number;
  todayDeclines: number;
  pendingReviews: number;
  balance: Balance;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: string;
}

export interface BankAccount {
  _id: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  bankAddress?: string;
  beneficiaryName?: string;
  supportedGeos: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  _id: string;
  name: string;
  pspLink: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  _id: string;
  merchantId: string;
  method: 'crypto' | 'bank_transfer';
  amount: number;
  currency: string;
  fee: number;
  netAmount: number;
  status: WithdrawalStatus;
  
  // Crypto-specific fields
  asset?: CryptoAsset;
  network?: string;
  address?: string;
  txHash?: string;
  confirmations?: number;
  explorerUrl?: string;
  
  // Bank transfer-specific fields
  bankAccount?: string;
  iban?: string;
  swiftCode?: string;
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
  beneficiaryName?: string;
  
  // Common fields
  transactionIds?: string[];
  failureReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

