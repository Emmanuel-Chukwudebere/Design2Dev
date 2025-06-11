// src/ui/components/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, style }: CardProps) {
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: 'var(--space-6)', // 12px
    border: '1px solid #F3F4F6', // Gray 100
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    ...style,
  };

  return <div style={cardStyle}>{children}</div>;
}