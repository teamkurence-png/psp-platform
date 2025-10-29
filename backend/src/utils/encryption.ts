import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Get encryption key from environment variable
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  // Convert hex string to buffer (expecting 64 hex characters for 32 bytes)
  return Buffer.from(key, 'hex');
};

/**
 * Encrypts sensitive data using AES-256-CBC
 */
export const encrypt = (text: string): string => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data (IV is needed for decryption)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts data encrypted with the encrypt function
 */
export const decrypt = (encryptedData: string): string => {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Encrypts card data for secure storage
 */
export const encryptCardData = (data: {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
}): {
  cardNumberEncrypted: string;
  expiryDateEncrypted: string;
  cvcEncrypted: string;
} => {
  return {
    cardNumberEncrypted: encrypt(data.cardNumber),
    expiryDateEncrypted: encrypt(data.expiryDate),
    cvcEncrypted: encrypt(data.cvc),
  };
};

/**
 * Decrypts card data
 */
export const decryptCardData = (encryptedData: {
  cardNumberEncrypted: string;
  expiryDateEncrypted: string;
  cvcEncrypted: string;
}): {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
} => {
  return {
    cardNumber: decrypt(encryptedData.cardNumberEncrypted),
    expiryDate: decrypt(encryptedData.expiryDateEncrypted),
    cvc: decrypt(encryptedData.cvcEncrypted),
  };
};

/**
 * Masks card number, showing only last 4 digits
 */
export const maskCardNumber = (cardNumber: string): string => {
  if (cardNumber.length < 4) return '****';
  const lastFour = cardNumber.slice(-4);
  return '**** **** **** ' + lastFour;
};

