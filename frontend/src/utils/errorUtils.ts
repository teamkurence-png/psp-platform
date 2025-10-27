/**
 * Extracts a user-friendly error message from various error formats
 * Handles Axios errors, API errors, validation errors, and generic errors
 */
export const extractErrorMessage = (error: any, defaultMessage = 'An error occurred. Please try again.'): string => {
  // Check for Axios response error
  if (error.response?.data?.error) {
    const errorData = error.response.data.error;
    
    // String error message
    if (typeof errorData === 'string') {
      return errorData;
    }
    
    // Array of validation errors (from Zod or similar)
    if (Array.isArray(errorData)) {
      return errorData
        .map((err: any) => {
          if (typeof err === 'string') return err;
          if (err.message) return err.message;
          if (err.path && err.message) return `${err.path.join('.')}: ${err.message}`;
          return JSON.stringify(err);
        })
        .join(', ');
    }
    
    // Object error with message property
    if (errorData.message) {
      return errorData.message;
    }
  }
  
  // Check for error message directly
  if (error.message) {
    return error.message;
  }
  
  // Network errors
  if (error.request && !error.response) {
    return 'Network error. Please check your connection and try again.';
  }
  
  return defaultMessage;
};

/**
 * Checks if an error is a specific HTTP status code
 */
export const isHttpError = (error: any, statusCode: number): boolean => {
  return error.response?.status === statusCode;
};

/**
 * Checks if an error is an authentication error (401)
 */
export const isAuthError = (error: any): boolean => {
  return isHttpError(error, 401);
};

/**
 * Checks if an error is a forbidden error (403)
 */
export const isForbiddenError = (error: any): boolean => {
  return isHttpError(error, 403);
};

/**
 * Checks if an error is a not found error (404)
 */
export const isNotFoundError = (error: any): boolean => {
  return isHttpError(error, 404);
};

/**
 * Checks if an error is a validation error (400)
 */
export const isValidationError = (error: any): boolean => {
  return isHttpError(error, 400);
};

