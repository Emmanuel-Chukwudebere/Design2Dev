// src/ui/features/ExportScreen.tsx
import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/state';
import { saveAs } from 'file-saver';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export function ExportScreen() {
  const { exportBundle } = useStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (exportBundle) {
      setIsReady(true);
    }
  }, [exportBundle]);

  const handleDownload = () => {
    if (!exportBundle?.zipFile) return;
    const blob = new Blob([exportBundle.zipFile], { type: 'application/zip' });
    saveAs(blob, 'Design2Dev_Export.zip');
  };

  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <h1 style={{ textAlign: 'center' }}>Export Ready!</h1>
      <Card>
        <p>Your comprehensive specification bundle is ready for download.</p>
        <p>It includes:</p>
        <ul style={{ paddingLeft: 'var(--space-8)' }}>
          <li>Component & Screen Specs (JSON)</li>
          <li>AI-Optimized Prompts (MD)</li>
          <li>SVG Assets</li>
        </ul>
        <Button onClick={handleDownload} disabled={!isReady} style={{ width: '100%' }}>
          {isReady ? 'Download .zip Bundle' : 'Processing...'}
        </Button>
      </Card>
    </div>
  );
}