import { parsingPlugin } from "./parsingPlugin.js";

export function shortcodeCollectorPlugin(overrides = {}) {
  return parsingPlugin ({
    delimiter: '⧰',
    emitAs: 'shortcode',
    onMatch: content => content.trim(),
    ...overrides,
  });
}
