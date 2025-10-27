import React from 'react';

interface ErrorAlertProps {
  message: string | null;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Reusable error alert component
 * Displays error messages in a consistent format across the application
 */
const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm relative ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p>{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-destructive hover:text-destructive/80 transition-colors"
            aria-label="Dismiss error"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
