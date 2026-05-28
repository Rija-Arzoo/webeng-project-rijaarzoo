/**
 * pdf.js (via pdf-parse v2) expects browser canvas APIs in Node.
 * Install polyfills before importing pdf-parse.
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function installPdfNodePolyfills() {
  if (globalThis.DOMMatrix && globalThis.ImageData && globalThis.Path2D) return;

  try {
    const canvas = require('@napi-rs/canvas');

    if (!globalThis.DOMMatrix && canvas.DOMMatrix) {
      globalThis.DOMMatrix = canvas.DOMMatrix;
    }
    if (!globalThis.ImageData && canvas.ImageData) {
      globalThis.ImageData = canvas.ImageData;
    }
    if (!globalThis.Path2D && canvas.Path2D) {
      globalThis.Path2D = canvas.Path2D;
    }
  } catch (err) {
    console.warn('PDF canvas polyfill unavailable:', err?.message || err);
  }
}
