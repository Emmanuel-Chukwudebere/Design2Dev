import React, { useState } from 'react';

// Add export handling
const [exportStatus, setExportStatus] = useState<'idle' | 'in-progress' | 'complete' | 'error'>('idle');

window.onmessage = async (event) => {
  const message = event.data.pluginMessage;
  
  switch (message.type) {
    // ... existing cases ...
    
    case 'EXPORT_STARTED':
      setExportStatus('in-progress');
      break;
      
    case 'EXPORT_COMPLETE':
      setExportStatus('complete');
      // Trigger download
      const blob = new Blob([JSON.stringify(message.bundle)], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'screen-export.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      break;
      
    case 'EXPORT_FAILED':
      setExportStatus('error');
      break;
  }
};

// Add export button handler
const handleExport = () => {
  parent.postMessage({ pluginMessage: { type: 'EXPORT_SCREENS' } }, '*');
};