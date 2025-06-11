// src/ui/lib/utils.ts
export function postToFigma(type, payload) {
    parent.postMessage({ pluginMessage: { type, payload } }, '*');
}
