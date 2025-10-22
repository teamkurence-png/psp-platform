import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm flex items-center justify-between">
      <div className="flex items-center">
        <AlertCircle className="h-4 w-4 mr-2" />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-4 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;

