import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const baseClass = 'button';
  const variantClass = variant === 'primary' ? 'button-primary' : 'button-secondary';
  const classes = `${baseClass} ${variantClass} ${className}`.trim();

  return (
    <button
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}