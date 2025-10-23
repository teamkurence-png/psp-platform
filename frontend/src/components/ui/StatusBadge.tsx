import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

type StatusType = 'success' | 'pending' | 'failed' | 'warning' | 'info';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  label?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type, label }) => {
  const getStatusConfig = () => {
    // Auto-detect type if not provided
    const detectedType = type || detectStatusType(status);
    
    switch (detectedType) {
      case 'success':
        return {
          icon: CheckCircle,
          className: 'text-green-600',
          label: label || status,
        };
      case 'pending':
        return {
          icon: Clock,
          className: 'text-yellow-600',
          label: label || status,
        };
      case 'failed':
        return {
          icon: XCircle,
          className: 'text-red-600',
          label: label || status,
        };
      case 'warning':
        return {
          icon: AlertCircle,
          className: 'text-orange-600',
          label: label || status,
        };
      case 'info':
        return {
          icon: Clock,
          className: 'text-blue-600',
          label: label || status,
        };
      default:
        return {
          icon: Clock,
          className: 'text-gray-600',
          label: label || status,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1 ${config.className}`}>
      <Icon className="h-4 w-4" />
      <span className="text-xs font-semibold capitalize">
        {config.label.replace(/_/g, ' ')}
      </span>
    </div>
  );
};

// Helper function to auto-detect status type
function detectStatusType(status: string): StatusType {
  const lowerStatus = status.toLowerCase();
  
  if (['completed', 'paid', 'approved', 'active', 'success'].includes(lowerStatus)) {
    return 'success';
  }
  if (['pending', 'initiated', 'processing'].includes(lowerStatus)) {
    return 'pending';
  }
  if (['failed', 'rejected', 'declined', 'reversed', 'cancelled'].includes(lowerStatus)) {
    return 'failed';
  }
  if (['on_chain', 'in_progress'].includes(lowerStatus)) {
    return 'info';
  }
  
  return 'pending';
}

export default StatusBadge;


