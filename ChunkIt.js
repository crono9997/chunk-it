import { ChunkItRuntime } from "./ChunkItRuntime.js";

export class ChunkIt {
  constructor() {
    this.pluginConfigs = [];
    this.baseHandlers = {};
  }

  use(plugin) {
    this.pluginConfigs.push(plugin);
    return this;
  }

  on(eventName, fn) {
    if (!this.baseHandlers[eventName]) this.baseHandlers[eventName] = [];
    this.baseHandlers[eventName].push(fn);
    return this;
  }

  spawn() {
    const runtime = new ChunkItRuntime();

    // Attach base handlers & plugins to runtime
    for (const [eventName, handlers] of Object.entries(this.baseHandlers)) {
      for (const fn of handlers) runtime.on(eventName, fn);
    }

    for (const plugin of this.pluginConfigs) {
      runtime.use(plugin);
    }

    return runtime;
  }

  async read(aiStream, res) {
    return this.spawn().read(aiStream, res);
  }

  onText(fn) {
    return this.on('response.output_text.delta', fn);
  }

  onStatus(fn) {
    return this.on('statusChange', fn);
  }

  onComplete(fn) {
    return this.on('response.completed', fn);
  }

  onError(fn) {
    return this.on('error', fn);
  }

  onAny(fn) {
    return this.on('*', fn);
  }
};
