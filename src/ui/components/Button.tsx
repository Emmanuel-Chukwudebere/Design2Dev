import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    padding: 'var(--space-4) var(--space-8)', // 8px 16px
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '9999px', // Fully rounded
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 200ms ease-out, background-color 200ms ease-out',
    outline: 'none',
  };

  const variantStyles: { [key: string]: React.CSSProperties } = {
    primary: {
      backgroundColor: '#111827', // Gray 900
      color: '#FFFFFF',
    },
    secondary: {
      backgroundColor: '#E5E7EB', // Gray 200
      color: '#111827', // Gray 900
    },
  };

  const style = { ...baseStyles, ...variantStyles[variant] };

  // This now correctly returns a JSX element
  return (
    <button style={style} {...props}>
      {children}
    </button>
  );
}