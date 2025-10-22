import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message, 
  actionLabel, 
  onAction,
  children 
}) => {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
};

export default EmptyState;

