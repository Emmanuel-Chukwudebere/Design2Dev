import React from 'react';
import { Button } from '../components/Button';

interface ErrorScreenProps {
  error: {
    message: string;
    context: string;
  };
  onRetry: () => void;
}

export function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  return (
    <div className="error-screen">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <h2 className="error-title">Something went wrong</h2>
        <div className="error-card">
          <div className="error-message">{error.message}</div>
          <div className="error-context">Context: {error.context}</div>
          <div className="error-actions">
            <Button onClick={onRetry}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 