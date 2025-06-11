// src/ui/features/WelcomeScreen.tsx
import React from 'react';
import { useStore } from '../lib/state';
import { postToFigma } from '../lib/utils';
import { Button } from '../components/Button';

export function WelcomeScreen() {
  const { setStage } = useStore();

  const handleAnalyzeClick = () => {
    setStage('analyzing');
    postToFigma('ANALYZE_SCREENS');
  };

  return (
    <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Design2Dev</h1>
      <p style={{ color: '#6B7280', marginTop: 0, marginBottom: 'var(--space-12)' }}>
        Select up to 5 screens in Figma and let's turn them into production-ready specs.
      </p>
      <Button onClick={handleAnalyzeClick} style={{ width: '100%' }}>
        Analyze Selected Screens
      </Button>
    </div>
  );
}