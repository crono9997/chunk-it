import { parsingPlugin } from './parsingPlugin.js';

export function jsonCollectorPlugin(overrides = {}) {
  return parsingPlugin({
    delimiter: 'ᛃ',
    emitAs: 'json',
    keepText: false, // we don't want to send the raw JSON text as normal messages
    onMatch: (content, status) => {
      try {
        return JSON.parse(content.trim());
      } catch {
        return { error: 'Invalid JSON', raw: content.trim() };
      }
    },
    ...overrides,
  });
}
