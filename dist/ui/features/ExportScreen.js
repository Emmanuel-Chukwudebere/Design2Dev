import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/ui/features/ExportScreen.tsx
import { useEffect, useState } from 'react';
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
        if (!(exportBundle === null || exportBundle === void 0 ? void 0 : exportBundle.zipFile))
            return;
        const blob = new Blob([exportBundle.zipFile], { type: 'application/zip' });
        saveAs(blob, 'Design2Dev_Export.zip');
    };
    return (_jsxs("div", { style: { padding: 'var(--space-8)' }, children: [_jsx("h1", { style: { textAlign: 'center' }, children: "Export Ready!" }), _jsxs(Card, { children: [_jsx("p", { children: "Your comprehensive specification bundle is ready for download." }), _jsx("p", { children: "It includes:" }), _jsxs("ul", { style: { paddingLeft: 'var(--space-8)' }, children: [_jsx("li", { children: "Component & Screen Specs (JSON)" }), _jsx("li", { children: "AI-Optimized Prompts (MD)" }), _jsx("li", { children: "SVG Assets" })] }), _jsx(Button, { onClick: handleDownload, disabled: !isReady, style: { width: '100%' }, children: isReady ? 'Download .zip Bundle' : 'Processing...' })] })] }));
}
