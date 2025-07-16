export class ChunkItRuntime {
  constructor() {
    this.handlers = {}; // { eventName: [fn, fn...] }

    this.status = {
      toolStates: {}, // { toolName: 'IN_PROGRESS' | 'COMPLETED' }
      collected: {}, // for plugins or manual use
      meta: {}, // misc (startTime, etc.)
      outputText: '',
    };

    this.toolMap = {}; // { itemId: toolName }
  }

  // -------------------------
  // PUBLIC API
  // -------------------------

  on(eventName, fn) {
    if (!this.handlers[eventName]) this.handlers[eventName] = [];
    this.handlers[eventName].push(fn);
    return this;
  }

  use(plugin) {
    if (plugin.on) {
      for (const [eventName, fn] of Object.entries(plugin.on)) {
        this.on(eventName, fn);
      }
    }
    return this;
  }

  async read(aiStream, res) {
    this.aiStream = aiStream;
    this.res = res;
    this.setupHeaders();

    try {
      for await (const chunk of this.aiStream) {
        await this.handleChunk(chunk);
      }
    } catch (err) {
      this.write({ type: 'error', message: err.message });
    }

    return this.status;
  }

  // -------------------------
  // INTERNAL HELPERS
  // -------------------------

  setupHeaders() {
    this.res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    this.res.setHeader('Transfer-Encoding', 'chunked');
    this.res.flushHeaders();
  }

  async handleChunk(chunk) {
    const type = chunk.type;

    // --- Track tool state internally ---
    if (
      type === 'response.output_item.added' &&
      chunk.item.type === 'mcp_call'
    ) {
      this.toolMap[chunk.item.id] = chunk.item.name;
      this.status.toolStates[chunk.item.name] = 'PENDING';
      this.emit('statusChange', chunk);
    }

    if (type === 'response.mcp_call.in_progress') {
      const toolName = this.toolMap[chunk.item_id];
      this.status.toolStates[toolName] = 'IN_PROGRESS';
      this.emit('statusChange', chunk);
    }

    if (type === 'response.mcp_call.completed') {
      const toolName = this.toolMap[chunk.item_id];
      this.status.toolStates[toolName] = 'COMPLETED';
      this.emit('statusChange', chunk);
    }

    // --- Emit event & decide whether to run default ---
    const shouldDefault = this.emit(type, chunk);

    if (!shouldDefault) return;

    // --- Default behavior ---
    if (type === 'response.output_text.delta' && chunk.delta) {
      this.write({ type: 'message', delta: chunk.delta });
    }

    if (type === 'response.completed') {
      this.write({
        type: 'done',
        usage: chunk.response.usage,
      });
    }
  }

  write(obj) {
    if (obj.type === 'message' && obj.delta) {
      this.status.outputText += obj.delta;
    }

    this.res.write(JSON.stringify(obj) + '\n');
  }

  emit(eventName, chunk) {
    const fns = [
      ...(this.handlers[eventName] || []),
      ...(this.handlers['*'] || []),
    ];

    let allowDefault = true;
    let curResult = {};

    for (const fn of fns) {
      const result = fn(chunk, this.status, curResult, this.write.bind(this));
      if (typeof result === 'object') {
        curResult = result;
        allowDefault = false;
      }

      if (allowDefault && result === false) allowDefault = false;
    }

    if (Object.keys(curResult).length > 0) {
      this.write(curResult);
      allowDefault = false;
    }

    return allowDefault;
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
}
