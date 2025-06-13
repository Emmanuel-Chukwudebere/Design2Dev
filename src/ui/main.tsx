// src/ui/main.tsx
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useStore } from './store';
import { WelcomeScreen } from './features/WelcomeScreen';
import { ReviewScreen } from './features/ReviewScreen';
import { ExportScreen } from './features/ExportScreen';
import { ErrorScreen } from './features/ErrorScreen';
import { postToFigma } from './lib/utils';
import './styles/main.css';

function App() {
  const { 
    appStage, 
    isLoading, 
    error,
    setAppStage,
    setLoading,
    setError,
    setPageInfo,
    setScreenSpecs,
    setAnalyzing,
    setAnalyzedScreens,
    clearError,
    setExportBundleData
  } = useStore();

  useEffect(() => {
    console.log('Setting up message listener');
    
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message:', event.data);
      
      const { pluginMessage } = event.data;
      if (!pluginMessage) {
        console.log('No plugin message in event data');
        return;
      }

      console.log('Processing message:', pluginMessage.type, pluginMessage.payload);

      switch (pluginMessage.type) {
        case 'PLUGIN_READY':
          console.log('Plugin is ready, setting loading to false');
          setLoading(false);
          break;

        case 'PAGE_INFO':
          console.log('Received page info:', pluginMessage.payload);
          setPageInfo(pluginMessage.payload);
          break;

        case 'ANALYSIS_STARTED':
          console.log('Analysis started');
          setAnalyzing(true);
          break;

        case 'ANALYSIS_COMPLETE':
          console.log('Analysis complete, updating stage and specs:', pluginMessage.payload);
          setScreenSpecs(pluginMessage.payload.screenSpecs);
          setAnalyzedScreens(pluginMessage.payload.screenSpecs);
          setAnalyzing(false);
          setAppStage('review');
          break;

        case 'ANALYSIS_FAILED':
          console.log('Analysis failed');
          setAnalyzing(false);
          setError({ 
            message: 'Failed to analyze screens. Please try again.',
            context: 'analysis'
          });
          break;

        case 'EXPORT_COMPLETE':
          console.log('Export complete, updating stage');
          setAppStage('export');
          setExportBundleData(pluginMessage.payload.bundle);
          break;

        case 'ERROR':
          console.log('Received error:', pluginMessage.payload);
          setError(pluginMessage.payload);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('Sending INIT message to Figma');
    postToFigma('INIT');

    return () => {
      console.log('Cleaning up message listener');
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  console.log('Current app stage:', appStage, 'isLoading:', isLoading);

  if (error) {
    return <ErrorScreen error={error} onRetry={clearError} />;
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div className="loading-text">Initializing...</div>
      </div>
    );
  }

  switch (appStage) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'analyzing':
    case 'review':
      return <ReviewScreen />;
    case 'export':
      return <ExportScreen />;
    default:
      return <ErrorScreen error={{ message: 'Invalid app stage', context: 'main' }} onRetry={clearError} />;
  }
}

// Wait for DOM to be ready
function initializeApp() {
  const container = document.getElementById('root');
  if (!container) {
    console.error('Root element not found, retrying in 100ms...');
    setTimeout(initializeApp, 100);
    return;
  }

  try {
    console.log('Initializing React app');
    const root = createRoot(container);
    root.render(<App />);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    const container = document.getElementById('root');
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h2>Design2Dev</h2>
          <p style="color: #666;">Failed to initialize app</p>
          <p style="font-size: 12px; color: #999;">${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    }
  }
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}