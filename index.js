import { ChunkIt } from "./ChunkIt.js";
import { parsingPlugin } from "./plugins/parsingPlugin.js";
import { jsonCollectorPlugin } from "./plugins/jsonCollectorPlugin.js";
import { usageCostPlugin } from "./plugins/usageCostPlugin.js";
import { shortcodeCollectorPlugin } from "./plugins/shortcodeCollectorPlugin.js";

export {
  ChunkIt,
  parsingPlugin,
  jsonCollectorPlugin,
  usageCostPlugin,
  shortcodeCollectorPlugin,
};

export default ChunkIt; // Default to the client