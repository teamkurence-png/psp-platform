/**
 * Card formatting utilities
 * Reusable formatting logic for card input fields
 */

/**
 * Format card number with spaces (XXXX XXXX XXXX XXXX)
 */
export const formatCardNumber = (value: string): string => {
  const digits = value.replace(/\s/g, '');
  const parts = digits.match(/.{1,4}/g);
  return parts ? parts.join(' ') : digits;
};

/**
 * Format expiry date as MM/YY
 */
export const formatExpiryDate = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 2) {
    return digits.slice(0, 2) + '/' + digits.slice(2, 4);
  }
  return digits;
};

/**
 * Format CVC (remove non-digits, limit to 4)
 */
export const formatCVC = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 4);
};

/**
 * Mask card number (show only last 4 digits)
 */
export const maskCardNumber = (cardNumber: string): string => {
  if (cardNumber.length < 4) return '****';
  const lastFour = cardNumber.slice(-4);
  return '**** **** **** ' + lastFour;
};

/**
 * Get clean card number (remove all non-digits)
 */
export const cleanCardNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

