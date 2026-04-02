interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-hipa-primary/10 text-hipa-primary',
  secondary: 'bg-gray-600/10 text-gray-600',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export default function Badge({ 
  children, 
  variant = 'default',
  size = 'sm'
}: BadgeProps) {
  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `}
    >
      {children}
    </span>
  );
}
