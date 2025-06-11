import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/ui/features/ReviewScreen.tsx
import { useState } from 'react';
import { useStore } from '../lib/state';
import { postToFigma } from '../lib/utils';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { designSystems } from '../../plugin/systems';
export function ReviewScreen() {
    const { discoveredComponents, screenSpecs, setStage } = useStore();
    const [editableComponents, setEditableComponents] = useState(discoveredComponents);
    const handleUpdateComponent = (id, updates) => {
        setEditableComponents(editableComponents.map((c) => (c.id === id ? Object.assign(Object.assign({}, c), updates) : c)));
    };
    const handleExport = () => {
        setStage('exporting');
        postToFigma('GENERATE_EXPORT', {
            finalComponents: editableComponents,
            finalScreens: screenSpecs,
        });
    };
    return (_jsxs("div", { style: { padding: 'var(--space-4)', height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }, children: [_jsxs("div", { style: { flex: 1, overflowY: 'auto' }, children: [_jsx("h2", { style: { padding: '0 var(--space-4)' }, children: "Review & Map" }), editableComponents.map((comp) => {
                        var _a;
                        return (_jsxs(Card, { style: { marginBottom: 'var(--space-6)' }, children: [_jsx("input", { type: "text", value: comp.name, onChange: (e) => handleUpdateComponent(comp.id, { name: e.target.value }), style: {
                                        width: '100%',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        padding: 'var(--space-3)',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        boxSizing: 'border-box',
                                        marginBottom: 'var(--space-4)'
                                    } }), comp.variants.length > 0 && (_jsxs("p", { style: { fontSize: '12px', color: '#6B7280', margin: '0 0 var(--space-4) 0' }, children: [comp.variants.length, " variant(s) detected."] })), _jsxs("select", { value: comp.mapping.designSystem, onChange: (e) => handleUpdateComponent(comp.id, { mapping: Object.assign(Object.assign({}, comp.mapping), { designSystem: e.target.value }) }), style: { width: '100%', padding: 'var(--space-3)', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: 'var(--space-2)' }, children: [_jsx("option", { value: "Custom", children: "Custom Component" }), designSystems.map(ds => (_jsx("option", { value: ds.name, children: ds.name }, ds.name)))] }), _jsx("p", { style: { fontSize: '12px', color: '#6B7280', margin: '0 0 var(--space-4) 0', padding: '0 var(--space-1)' }, children: comp.mapping.designSystem === 'Custom' ? 'Generates a new component from scratch.' : (_a = designSystems.find(ds => ds.name === comp.mapping.designSystem)) === null || _a === void 0 ? void 0 : _a.description }), _jsx(Button, { variant: "secondary", onClick: () => postToFigma('HIGHLIGHT_NODE', { nodeId: comp.id.replace('comp-', '') }), style: { width: '100%' }, children: "Highlight on Canvas" })] }, comp.id));
                    })] }), _jsx("div", { style: { padding: 'var(--space-4) 0' }, children: _jsx(Button, { onClick: handleExport, style: { width: '100%' }, children: "Proceed to Export" }) })] }));
}
