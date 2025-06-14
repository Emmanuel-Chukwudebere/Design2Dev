// src/ui/main.tsx
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useStore } from './store';
import { WelcomeScreen } from './features/WelcomeScreen';
import { AnalysisScreen } from './features/AnalysisScreen';
import { ResultsScreen } from './features/ResultsScreen';
import { ErrorScreen } from './features/ErrorScreen';
import { postToFigma } from './lib/utils';
import './styles/main.css';

export function App() {
  const {
    appStage,
    setAppStage,
    setScreenSpecs,
    setError,
    setAnalyzing,
    setExporting
  } = useStore();

  useEffect(() => {
    // Request initial page info
    postToFigma('GET_PAGE_INFO', null);

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data.pluginMessage;
      
      switch (type) {
        case 'ANALYSIS_COMPLETE':
          setAnalyzing(false);
          setScreenSpecs(payload.screenSpecs);
          setAppStage('results');
          break;

        case 'ANALYSIS_ERROR':
          setAnalyzing(false);
          setError({ message: payload.error });
          break;

        case 'EXPORT_COMPLETE':
          setExporting(false);
          setAppStage('export');
          break;

        case 'EXPORT_ERROR':
          setExporting(false);
          setError({ message: payload.error });
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setAppStage, setScreenSpecs, setError, setAnalyzing, setExporting]);

  switch (appStage) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'results':
      return <ResultsScreen />;
    case 'export':
      return <ResultsScreen />;
    default:
      return <WelcomeScreen />;
  }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (!container) {
    console.error('Root element not found');
  } else {
    const root = createRoot(container);
    root.render(<App />);
  }
});