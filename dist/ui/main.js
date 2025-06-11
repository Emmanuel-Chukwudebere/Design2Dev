import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/ui/main.tsx
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useStore } from './lib/state';
import { postToFigma } from './lib/utils';
import { WelcomeScreen } from './features/WelcomeScreen';
import { ReviewScreen } from './features/ReviewScreen';
import { ExportScreen } from './features/ExportScreen';
const styles = document.createElement('style');
document.head.appendChild(styles);
styles.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  :root { /* 2px spacing system */
    --space-1: 2px; --space-2: 4px; --space-3: 6px; --space-4: 8px;
    --space-5: 10px; --space-6: 12px; --space-8: 16px; --space-12: 24px;
  }
  body { margin: 0; font-family: 'Inter', sans-serif; background-color: #FAFBFC; color: #111827; }
  .loading-spinner {
    width: 48px; height: 48px; border: 5px solid #F3F4F6;
    border-bottom-color: #111827; border-radius: 50%; display: inline-block;
    box-sizing: border-box; animation: rotation 1s linear infinite;
  }
  @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;
function LoadingIndicator({ text }) {
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }, children: [_jsx("div", { className: "loading-spinner" }), _jsx("p", { style: { marginTop: 'var(--space-8)', fontWeight: 600 }, children: text })] }));
}
function App() {
    const store = useStore();
    useEffect(() => {
        window.onmessage = (event) => {
            const { type, payload } = event.data.pluginMessage;
            switch (type) {
                case 'INIT_COMPLETE':
                    store.setDiscoveredComponents(payload.discoveredComponents);
                    store.setLoading(false);
                    break;
                case 'ANALYSIS_COMPLETE':
                    store.setScreenSpecs(payload.screenSpecs);
                    store.setStage('review');
                    break;
                case 'ANALYSIS_FAILED':
                    store.setStage('welcome'); // Reset to welcome screen on failure
                    break;
                case 'EXPORT_COMPLETE':
                    store.setExportBundle(payload.exportBundle);
                    store.setStage('complete');
                    break;
            }
        };
        postToFigma('INIT');
    }, []);
    if (store.isLoading) {
        return _jsx(LoadingIndicator, { text: "Discovering components..." });
    }
    switch (store.appStage) {
        case 'welcome':
            return _jsx(WelcomeScreen, {});
        case 'analyzing':
            return _jsx(LoadingIndicator, { text: "Analyzing screens..." });
        case 'review':
            return _jsx(ReviewScreen, {});
        case 'exporting':
            return _jsx(LoadingIndicator, { text: "Generating bundle..." });
        case 'complete':
            return _jsx(ExportScreen, {});
        default:
            return _jsx(WelcomeScreen, {});
    }
}
createRoot(document.getElementById('root')).render(_jsx(App, {}));
