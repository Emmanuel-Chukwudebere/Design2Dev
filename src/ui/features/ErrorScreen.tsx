import React from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface ErrorScreenProps {
  error: {
    message: string;
    context: string;
  };
  onRetry: () => void;
}

export function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  return (
    <div className="section">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <h2 className="error-title">Something went wrong</h2>
        <Card>
          <div className="error-message">{error.message}</div>
          <div className="error-context">Context: {error.context}</div>
          <div className="error-actions">
            <Button onClick={onRetry} variant="primary">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 