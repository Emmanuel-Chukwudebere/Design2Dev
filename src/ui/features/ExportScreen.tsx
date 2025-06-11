// src/ui/features/ExportScreen.tsx
import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/state';
import { saveAs } from 'file-saver';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export function ExportScreen() {
  const { exportBundle, setError } = useStore();
  const [isReady, setIsReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (exportBundle) {
      setIsReady(true);
    }
  }, [exportBundle]);

  const handleDownload = async () => {
    if (!exportBundle?.zipFile) {
      setError({
        message: 'Export bundle is not ready',
        context: 'export'
      });
      return;
    }

    try {
      setIsDownloading(true);
      const blob = new Blob([exportBundle.zipFile], { type: 'application/zip' });
      await saveAs(blob, 'Design2Dev_Export.zip');
    } catch (error) {
      setError({
        message: error instanceof Error ? error.message : 'Failed to download export bundle',
        context: 'export'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="section">
      <div className="section-title">Export Ready!</div>
      <Card>
        <p>Your comprehensive specification bundle is ready for download.</p>
        <p>It includes:</p>
        <ul className="export-list">
          <li>Component & Screen Specs (JSON)</li>
          <li>AI-Optimized Prompts (MD)</li>
          <li>SVG Assets</li>
          <li>PNG Assets (1x, 2x, 3x)</li>
        </ul>
        <Button 
          onClick={handleDownload} 
          disabled={!isReady || isDownloading}
          className="export-button"
        >
          {isDownloading ? 'Downloading...' : isReady ? 'Download .zip Bundle' : 'Processing...'}
        </Button>
      </Card>
    </div>
  );
}