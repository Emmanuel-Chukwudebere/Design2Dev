import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ 
  children, 
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick
}: CardProps) {
  const baseClasses = 'rounded-xl transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg border border-gray-100',
    outlined: 'bg-transparent border-2 border-gray-300',
    ghost: 'bg-transparent border border-transparent'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const interactiveClasses = onClick || hover 
    ? 'cursor-pointer hover:shadow-md hover:border-gray-300 active:scale-[0.98]' 
    : '';

  const classes = `
    ${baseClasses} 
    ${variantClasses[variant]} 
    ${paddingClasses[padding]} 
    ${interactiveClasses} 
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={classes} onClick={onClick} role={onClick ? 'button' : 'group'}>
      {children}
    </div>
  );
}

// Card sub-components for better composition
Card.Header = function CardHeader({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

Card.Title = function CardTitle({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
};

Card.Description = function CardDescription({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <p className={`text-sm text-gray-600 mt-1 ${className}`}>
      {children}
    </p>
  );
};

Card.Content = function CardContent({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`mt-6 pt-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
};