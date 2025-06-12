// src/ui/features/ExportScreen.tsx
import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/state';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export function ExportScreen() {
  const { exportBundle, setError } = useStore();
  const [isReady, setIsReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (exportBundle && exportBundle.assets && exportBundle.screenSpecs) {
      setIsReady(true);
    }
  }, [exportBundle]);

  const handleDownload = async () => {
    setError({
      message: 'Download functionality is not implemented in this version.',
      context: 'export'
    });
  };

  return (
    <div className="section">
      <div className="section-title">Export Ready!</div>
      <Card>
        <p>Your comprehensive specification bundle is ready for review.</p>
        <p>It includes:</p>
        <ul className="export-list">
          <li>Screen Specs (JSON)</li>
          <li>AI-Optimized Prompts (MD)</li>
          <li>Assets</li>
        </ul>
        <Button 
          onClick={handleDownload} 
          disabled={!isReady || isDownloading}
          className="export-button"
        >
          {isDownloading ? 'Downloading...' : isReady ? 'Download (Coming Soon)' : 'Processing...'}
        </Button>
      </Card>
    </div>
  );
}