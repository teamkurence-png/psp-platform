import { useState, useCallback } from 'react';
import type { CardPaymentData } from '../services/pspPaymentService';
import { validateCardFields } from '../utils/cardValidator';
import { formatCardNumber, formatExpiryDate, formatCVC, cleanCardNumber } from '../utils/cardFormatter';

/**
 * Custom hook for card form management
 * Handles state, validation, and formatting
 */
export const useCardForm = () => {
  const [formData, setFormData] = useState<CardPaymentData>({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CardPaymentData, string>>>({});

  /**
   * Handle input change with automatic formatting
   */
  const handleInputChange = useCallback((field: keyof CardPaymentData, value: string) => {
    let formattedValue = value;

    switch (field) {
      case 'cardNumber':
        const digits = cleanCardNumber(value);
        formattedValue = formatCardNumber(digits);
        break;
      case 'expiryDate':
        formattedValue = formatExpiryDate(value);
        break;
      case 'cvc':
        formattedValue = formatCVC(value);
        break;
      default:
        formattedValue = value;
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  /**
   * Validate entire form
   */
  const validateForm = useCallback((): boolean => {
    const validationErrors = validateCardFields(formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [formData]);

  /**
   * Get submission data (with cleaned card number)
   */
  const getSubmissionData = useCallback((): CardPaymentData => {
    return {
      ...formData,
      cardNumber: cleanCardNumber(formData.cardNumber),
    };
  }, [formData]);

  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    setFormData({
      cardholderName: '',
      cardNumber: '',
      expiryDate: '',
      cvc: '',
    });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    handleInputChange,
    validateForm,
    getSubmissionData,
    resetForm,
  };
};

