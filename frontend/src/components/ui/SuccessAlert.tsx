import React from 'react';

interface SuccessAlertProps {
  title?: string;
  message: string;
  description?: string;
  className?: string;
}

/**
 * Reusable success alert component
 * Displays success messages in a consistent format across the application
 */
const SuccessAlert: React.FC<SuccessAlertProps> = ({ 
  title, 
  message, 
  description, 
  className = '' 
}) => {
  return (
    <div className={`bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md ${className}`}>
      {title && <p className="font-medium mb-2">{title}</p>}
      <p className="text-sm">{message}</p>
      {description && <p className="text-sm mt-2">{description}</p>}
    </div>
  );
};

export default SuccessAlert;

