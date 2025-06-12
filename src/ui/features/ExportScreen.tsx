// src/ui/features/ExportScreen.tsx
import React from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';

export function ExportScreen() {
  const { screenSpecs, setAppStage } = useStore();

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log('Download functionality coming soon');
  };

  return (
    <div className="export-screen">
      <div className="section-title">Export Ready!</div>
      <div className="export-content">
        <p>Your comprehensive specification bundle is ready for review.</p>
        <p>It includes:</p>
        <ul className="export-list">
          <li>Screen Specs (JSON)</li>
          <li>AI-Optimized Prompts (MD)</li>
          <li>Assets</li>
        </ul>
        <div className="export-actions">
          <Button onClick={handleDownload}>
            Download Bundle
          </Button>
          <Button 
            variant="secondary"
            onClick={() => setAppStage('review')}
          >
            Back to Review
          </Button>
        </div>
      </div>
    </div>
  );
}