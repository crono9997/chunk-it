export function parsingPlugin({
  delimiter,
  start,
  end,
  emitAs = 'parsed',
  keepText = false,
  onMatch = content => content,
}) {
  start = start ?? delimiter;
  end = end ?? delimiter;
  return {
    on: {
      'response.output_text.delta': (chunk, status, curResult, write) => {
        // Initialize buffer state for this parser if not already
        if (!status.collected[emitAs]) status.collected[emitAs] = [];
        if (!status.collected._buffers) status.collected._buffers = {};
        if (!status.collected._buffers[emitAs]) {
          status.collected._buffers[emitAs] = {
            active: false,
            buffer: '',
          };
        }

        const state = status.collected._buffers[emitAs];
        let text = chunk.delta;
        let modified = false;

        while (text.length > 0) {
          if (!state.active) {
            const startIdx = text.indexOf(start);

            if (startIdx === -1) {
              // No start delimiter → stream as normal
              chunk.delta = text; // Stream the remaining text
              break;
            }

            chunk.delta = text.slice(0, startIdx);

            // Enter active buffering mode
            state.active = true;
            state.buffer = '';
            text = text.slice(startIdx + start.length);
            modified = true;
          } else {
            const endIdx = text.indexOf(end);

            if (endIdx === -1) {
              // Still buffering until we find end delimiter
              state.buffer += text;
              text = '';

              return false;
            } else {
              // Found end delimiter → complete match
              state.buffer += text.slice(0, endIdx);
              const content = onMatch(state.buffer, status);

              status.collected[emitAs].push(content);
              write({ type: emitAs, content });

              // Reset active state
              state.active = false;
              state.buffer = '';

              text = text.slice(endIdx + end.length);
              chunk.delta = text;
              modified = true;
            }
          }
        }

        return true; // Let defaults run if we keep text
      },

      'response.completed': (chunk, status, curResult, write) => {
        const state = status.collected._buffers?.[emitAs];
        if (state?.active && state.buffer) {
          // Flush partial buffer if we were mid-buffering
          if (keepText) {
            write({ type: 'message', delta: `${start}${state.buffer}` });
          }
          state.active = false;
          state.buffer = '';
        }
        return true;
      },
    },
  };
}
