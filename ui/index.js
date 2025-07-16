// --- Core UI Client ---
import { ChunkItUI } from "./ChunkItUI.js";

// --- Built-in UI Plugins ---
import { messagesPlugin } from "./plugins/messagesPlugin.js";
// Later: usageCostPlugin (client), autoScrollPlugin, etc.

export {
  ChunkItUI,
  messagesPlugin
};

export default ChunkItUI; // default export = UI client