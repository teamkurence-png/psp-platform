import crypto from 'crypto';

interface EncryptedCardData {
  cardNumberEncrypted: string;
  expiryDateEncrypted: string;
  cvcEncrypted: string;
}

interface DecryptedCardData {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
}

/**
 * Service class for encryption/decryption operations
 * Implements AES-256-CBC encryption for sensitive data
 */
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly ivLength = 16;
  private encryptionKey: Buffer | null = null;

  /**
   * Lazy initialization of encryption key
   */
  private getEncryptionKey(): Buffer {
    if (!this.encryptionKey) {
      const key = process.env.ENCRYPTION_KEY;
      if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
      }
      this.encryptionKey = Buffer.from(key, 'hex');
    }
    return this.encryptionKey;
  }

  /**
   * Encrypt a single string value
   */
  encrypt(text: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return IV + encrypted data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt a single string value
   */
  decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const parts = encryptedData.split(':');
      
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt card data object
   */
  encryptCardData(data: DecryptedCardData): EncryptedCardData {
    return {
      cardNumberEncrypted: this.encrypt(data.cardNumber),
      expiryDateEncrypted: this.encrypt(data.expiryDate),
      cvcEncrypted: this.encrypt(data.cvc),
    };
  }

  /**
   * Decrypt card data object
   */
  decryptCardData(encryptedData: EncryptedCardData): DecryptedCardData {
    return {
      cardNumber: this.decrypt(encryptedData.cardNumberEncrypted),
      expiryDate: this.decrypt(encryptedData.expiryDateEncrypted),
      cvc: this.decrypt(encryptedData.cvcEncrypted),
    };
  }

  /**
   * Mask card number, showing only last 4 digits
   */
  maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 4) return '****';
    const lastFour = cardNumber.slice(-4);
    return '**** **** **** ' + lastFour;
  }
}

