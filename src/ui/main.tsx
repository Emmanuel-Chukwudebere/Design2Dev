// src/ui/main.tsx
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useStore } from './store';
import { postToFigma } from './lib/utils';
import { WelcomeScreen } from './features/WelcomeScreen';
import { ReviewScreen } from './features/ReviewScreen';
import { ExportScreen } from './features/ExportScreen';
import { ErrorScreen } from './features/ErrorScreen';
import './styles/main.css';

function LoadingIndicator({ text }: { text: string }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-text">{text}</div>
    </div>
  );
}

function App() {
  const store = useStore();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data.pluginMessage;
      
      switch (type) {
        case 'PLUGIN_READY':
          store.setLoading(false);
          break;

        case 'PAGE_INFO':
          store.setPageInfo(payload);
          break;

        case 'ANALYSIS_STARTED':
          store.setAnalyzing(true);
          store.setStage('analyzing');
          break;

        case 'ANALYSIS_COMPLETE':
          store.setScreenSpecs(payload.screenSpecs);
          store.setAnalyzing(false);
          store.setStage('review');
          break;

        case 'ANALYSIS_FAILED':
          store.setAnalyzing(false);
          store.setError({
            message: 'Failed to analyze screens',
            context: 'analysis'
          });
          break;

        case 'EXPORT_STARTED':
          store.setExporting(true);
          store.setStage('exporting');
          break;

        case 'EXPORT_COMPLETE':
          store.setExporting(false);
          store.setStage('complete');
          break;

        case 'EXPORT_FAILED':
          store.setExporting(false);
          store.setError({
            message: 'Failed to generate export bundle',
            context: 'export'
          });
          break;

        case 'ERROR':
          store.setError({
            message: payload.message,
            context: payload.context
          });
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    postToFigma('INIT');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  if (store.isLoading) {
    return <LoadingIndicator text="Initializing..." />;
  }

  if (store.error) {
    return <ErrorScreen error={store.error} onRetry={store.clearError} />;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Design2Dev</h1>
        <p>Design to Code, Instantly</p>
      </div>
      <div className="content">
        {store.appStage === 'welcome' && <WelcomeScreen />}
        {store.appStage === 'analyzing' && <LoadingIndicator text="Analyzing screens..." />}
        {store.appStage === 'review' && <ReviewScreen />}
        {store.appStage === 'exporting' && <LoadingIndicator text="Generating bundle..." />}
        {store.appStage === 'complete' && <ExportScreen />}
      </div>
    </div>
  );
}

// Initialize app
const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
