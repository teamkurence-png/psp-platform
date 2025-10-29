/**
 * Card validation utilities
 * Reusable validation logic for credit/debit cards
 */

/**
 * Validate card number using Luhn algorithm
 */
export const validateCardNumber = (number: string): boolean => {
  const digits = number.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate expiry date format (MM/YY)
 */
export const validateExpiryDate = (expiryDate: string): { valid: boolean; error?: string } => {
  const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  
  if (!expiryRegex.test(expiryDate)) {
    return { valid: false, error: 'Invalid expiry date (MM/YY)' };
  }

  // Check if card is expired
  const [month, year] = expiryDate.split('/');
  const expiry = new Date(2000 + parseInt(year), parseInt(month));
  
  if (expiry < new Date()) {
    return { valid: false, error: 'Card has expired' };
  }

  return { valid: true };
};

/**
 * Validate CVC code
 */
export const validateCVC = (cvc: string): boolean => {
  return /^\d{3,4}$/.test(cvc);
};

/**
 * Validate cardholder name
 */
export const validateCardholderName = (name: string): boolean => {
  return name.trim().length > 0;
};

/**
 * Detect card brand from card number
 */
export const detectCardBrand = (cardNumber: string): string => {
  const digits = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  
  return 'Unknown';
};

/**
 * Validate all card fields
 */
export const validateCardFields = (data: {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!validateCardholderName(data.cardholderName)) {
    errors.cardholderName = 'Cardholder name is required';
  }

  const cardDigits = data.cardNumber.replace(/\s/g, '');
  if (!validateCardNumber(cardDigits)) {
    errors.cardNumber = 'Invalid card number';
  }

  const expiryValidation = validateExpiryDate(data.expiryDate);
  if (!expiryValidation.valid) {
    errors.expiryDate = expiryValidation.error!;
  }

  if (!validateCVC(data.cvc)) {
    errors.cvc = 'Invalid CVC';
  }

  return errors;
};

