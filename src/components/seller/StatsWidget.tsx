interface StatsWidgetProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-600',
  primary: 'bg-hipa-primary/10 text-hipa-primary',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-yellow-100 text-yellow-600',
  danger: 'bg-red-100 text-red-600',
};

export default function StatsWidget({
  title,
  value,
  change,
  changeLabel,
  icon,
  variant = 'default',
}: StatsWidgetProps) {
  const isPositiveChange = change && change > 0;
  const isNegativeChange = change && change < 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span 
                className={`
                  text-sm font-medium
                  ${isPositiveChange ? 'text-green-600' : ''}
                  ${isNegativeChange ? 'text-red-600' : ''}
                  ${!isPositiveChange && !isNegativeChange ? 'text-gray-500' : ''}
                `}
              >
                {isPositiveChange && '+'}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className={`p-3 rounded-lg ${variantStyles[variant]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
