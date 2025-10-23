import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  iconColor?: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  className?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
    gradient: 'from-blue-50 to-blue-100/50',
  },
  green: {
    bg: 'bg-green-100',
    icon: 'text-green-600',
    gradient: 'from-green-50 to-green-100/50',
  },
  red: {
    bg: 'bg-red-100',
    icon: 'text-red-600',
    gradient: 'from-red-50 to-red-100/50',
  },
  amber: {
    bg: 'bg-amber-100',
    icon: 'text-amber-600',
    gradient: 'from-amber-50 to-amber-100/50',
  },
  purple: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
    gradient: 'from-purple-50 to-purple-100/50',
  },
};

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  iconColor = 'blue',
  className = '',
}) => {
  const colors = colorClasses[iconColor];
  
  return (
    <Card className={`shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-3">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">{value}</h3>
            {trend && trendValue && (
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                trend === 'up' 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {trend === 'up' ? (
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 mr-1" />
                )}
                {trendValue}
              </div>
            )}
          </div>
          <div className={`p-3 ${colors.bg} rounded-xl`}>
            <Icon className={`h-6 w-6 ${colors.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;

