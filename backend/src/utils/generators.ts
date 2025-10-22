import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generate a unique reference code for bank wire transfers
 */
export const generateReferenceCode = (): string => {
  return `REF${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

/**
 * Generate a unique checkout URL for card payments
 */
export const generateCheckoutUrl = (paymentRequestId: string): string => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/pay/${paymentRequestId}`;
};

/**
 * Generate transaction ID
 */
export const generateTransactionId = (): string => {
  return `TXN${Date.now()}${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
};

/**
 * Generate settlement ID
 */
export const generateSettlementId = (): string => {
  return `SET${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

/**
 * Generate UUID
 */
export const generateUUID = (): string => {
  return uuidv4();
};

