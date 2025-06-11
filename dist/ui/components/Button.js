var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
export function Button(_a) {
    var { children, variant = 'primary' } = _a, props = __rest(_a, ["children", "variant"]);
    const baseStyles = {
        padding: 'var(--space-4) var(--space-8)', // 8px 16px
        fontSize: '14px',
        fontWeight: 600,
        borderRadius: '9999px', // Fully rounded
        border: 'none',
        cursor: 'pointer',
        transition: 'transform 200ms ease-out, background-color 200ms ease-out',
        outline: 'none',
    };
    const variantStyles = {
        primary: {
            backgroundColor: '#111827', // Gray 900
            color: '#FFFFFF',
        },
        secondary: {
            backgroundColor: '#E5E7EB', // Gray 200
            color: '#111827', // Gray 900
        },
    };
    const style = Object.assign(Object.assign({}, baseStyles), variantStyles[variant]);
    // This now correctly returns a JSX element
    return (_jsx("button", Object.assign({ style: style }, props, { children: children })));
}
