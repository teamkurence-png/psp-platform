export const UserRole = {
  MERCHANT: 'merchant',
  OPS: 'ops',
  FINANCE: 'finance',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const OnboardingStatus = {
  NOT_STARTED: 'not_started',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type OnboardingStatus = typeof OnboardingStatus[keyof typeof OnboardingStatus];

export const PaymentMethod = {
  BANK_WIRE: 'bank_wire',
  CARD: 'card',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentRequestStatus = {
  SENT: 'sent',
  VIEWED: 'viewed',
  PENDING_SUBMISSION: 'pending_submission',
  SUBMITTED: 'submitted',
  AWAITING_3D_SMS: 'awaiting_3d_sms',
  AWAITING_3D_PUSH: 'awaiting_3d_push',
  VERIFICATION_COMPLETED: 'verification_completed',
  PROCESSED_AWAITING_EXCHANGE: 'processed_awaiting_exchange',
  PROCESSED: 'processed',
  REJECTED: 'rejected',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  FAILED: 'failed',
  PAID: 'paid',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export type PaymentRequestStatus = typeof PaymentRequestStatus[keyof typeof PaymentRequestStatus];

export const WithdrawalStatus = {
  INITIATED: 'initiated',
  ON_CHAIN: 'on_chain',
  PAID: 'paid',
  FAILED: 'failed',
  REVERSED: 'reversed',
} as const;

export type WithdrawalStatus = typeof WithdrawalStatus[keyof typeof WithdrawalStatus];

export const CryptoAsset = {
  USDT_TRC20: 'usdt_trc20',
  USDT_ERC20: 'usdt_erc20',
  BTC: 'btc',
  ETH: 'eth',
} as const;

export type CryptoAsset = typeof CryptoAsset[keyof typeof CryptoAsset];

export const BankRail = {
  SEPA: 'sepa',
  SWIFT: 'swift',
  LOCAL: 'local',
} as const;

export type BankRail = typeof BankRail[keyof typeof BankRail];

export const WithdrawalSource = {
  BALANCE: 'balance',
  COMMISSION: 'commission',
} as const;

export type WithdrawalSource = typeof WithdrawalSource[keyof typeof WithdrawalSource];

export const CommissionStatus = {
  PENDING: 'pending',
  CREDITED: 'credited',
  WITHDRAWN: 'withdrawn',
} as const;

export type CommissionStatus = typeof CommissionStatus[keyof typeof CommissionStatus];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  twoFactorEnabled: boolean;
  isMerchantLeader?: boolean;
  merchantLeaderId?: string;
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
  isMerchantLeader?: boolean;
  merchantLeaderId?: string | { _id: string; legalName: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  _id: string;
  merchantId: string;
  userId?: string | { _id: string; legalName: string; email: string }; // Can be populated
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
  pspPaymentLink?: string;
  pspPaymentToken?: string;
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
  commissionPercent?: number;
  commissionAmount?: number;
  netAmount?: number;
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
  commissionBalance: number;
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
  minTransactionLimit: number;
  maxTransactionLimit: number;
  commissionPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  _id: string;
  name: string;
  pspLink: string;
  commissionPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  _id: string;
  merchantId: string;
  userId?: string | {
    _id: string;
    legalName: string;
    email: string;
    supportEmail?: string;
  };
  method: 'crypto' | 'bank_transfer';
  source: WithdrawalSource;
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

export interface Commission {
  _id: string;
  userId: string;
  merchantId: string | { _id: string; legalName: string; email: string };
  paymentRequestId: string | { _id: string; invoiceNumber: string; amount: number; status: PaymentRequestStatus };
  amount: number;
  paymentAmount: number;
  currency: string;
  status: CommissionStatus;
  creditedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantLeaderDashboard {
  groupMerchantsCount: number;
  totalPaymentRequests: number;
  paymentRequestStats: Array<{
    _id: PaymentRequestStatus;
    count: number;
    totalAmount: number;
  }>;
  recentPaymentRequests: PaymentRequest[];
  commissionStats: {
    totalCommission: number;
    totalPayments: number;
    commissionByMonth: Array<{
      _id: { year: number; month: number };
      totalCommission: number;
      count: number;
    }>;
  };
  commissionBalance: number;
  currency: string;
}

