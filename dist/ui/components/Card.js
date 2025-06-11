import { jsx as _jsx } from "react/jsx-runtime";
export function Card({ children, style }) {
    const cardStyle = Object.assign({ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: 'var(--space-6)', border: '1px solid #F3F4F6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }, style);
    return _jsx("div", { style: cardStyle, children: children });
}
