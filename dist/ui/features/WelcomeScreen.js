import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStore } from '../lib/state';
import { postToFigma } from '../lib/utils';
import { Button } from '../components/Button';
export function WelcomeScreen() {
    const { setStage } = useStore();
    const handleAnalyzeClick = () => {
        setStage('analyzing');
        postToFigma('ANALYZE_SCREENS');
    };
    return (_jsxs("div", { style: { padding: 'var(--space-8)', textAlign: 'center' }, children: [_jsx("h1", { style: { fontSize: '24px', fontWeight: 700, marginBottom: 'var(--space-2)' }, children: "Design2Dev" }), _jsx("p", { style: { color: '#6B7280', marginTop: 0, marginBottom: 'var(--space-12)' }, children: "Select up to 5 screens in Figma and let's turn them into production-ready specs." }), _jsx(Button, { onClick: handleAnalyzeClick, style: { width: '100%' }, children: "Analyze Selected Screens" })] }));
}
