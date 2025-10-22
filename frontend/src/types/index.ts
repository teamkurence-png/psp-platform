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
  description?: string;
  invoiceNumber?: string;
  dueDate?: string;
  customerReference?: string;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    billingCountry?: string;
  };
  paymentMethods: PaymentMethod[];
  status: PaymentRequestStatus;
  referenceCode?: string;
  checkoutUrl?: string;
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

export interface Transaction {
  _id: string;
  transactionId: string;
  paymentRequestId?: string;
  merchantId: string;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
  };
  method: PaymentMethod;
  amount: number;
  currency: string;
  fees: number;
  net: number;
  merchantConfirmation: MerchantConfirmation;
  platformStatus: TransactionStatus;
  riskScore: number;
  cardDetails?: {
    brand?: string;
    bin?: string;
    last4?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cardholderName?: string;
  };
  bankWireDetails?: {
    iban?: string;
    senderName?: string;
    senderBank?: string;
    confirmationStatus: MerchantConfirmation;
    proofFilePath?: string;
    receivedDate?: string;
    referenceNumber?: string;
  };
  timeline: Array<{
    event: string;
    timestamp: string;
    actor?: string;
    notes?: string;
  }>;
  notes: Array<{
    text: string;
    createdBy: string;
    createdAt: string;
  }>;
  attachments: Array<{
    fileName: string;
    filePath: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;
  riskSignals?: {
    ipAddress?: string;
    deviceFingerprint?: string;
    velocityScore?: number;
    blacklistMatches?: string[];
  };
  refunded: boolean;
  refundAmount?: number;
  refundedAt?: string;
  settledAt?: string;
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

