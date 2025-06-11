// src/ui/lib/utils.ts
export function postToFigma(type: string, payload?: any) {
    parent.postMessage({ pluginMessage: { type, payload } }, '*');
  }