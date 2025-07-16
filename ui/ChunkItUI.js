export const ChunkItUI = ({ uri }) => {
  const handlers = {};
  const api = {};

  api.on = (eventName, fn) => {
    if (!handlers[eventName]) handlers[eventName] = [];
    handlers[eventName].push(fn);
    return api;
  };

  api.sendPrompt = async (prompt, previousResponseId) => {
    if (!prompt) return;

    if (handlers.reset) {
      handlers.reset.forEach(fn => fn());
    }

    console.log('Sending prompt:', prompt);

    const response = await fetch(uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, previousResponseId }),
    });

    if (!response.body) {
      console.error('No response body received!');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);

          if (handlers[data.type]) {
            handlers[data.type].forEach(fn => fn(data));
          }
        } catch (err) {
          console.error('Error parsing line:', line, err);
        }
      }
    }
  };

  api.onText = fn => api.on('message', fn);
  api.onShortcode = fn => api.on('shortcode', fn);
  api.onJson = fn => api.on('json', fn);
  api.onDone = fn => api.on('done', fn);
  api.onReset = fn => api.on('reset', fn);

  api.use = plugin => {
    if (plugin.on) {
      for (const [eventName, fn] of Object.entries(plugin.on)) {
        api.on(eventName, fn);
      }
    }

    return api;
  };

  return api;
};