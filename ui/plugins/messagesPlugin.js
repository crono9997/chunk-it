export const messagesPlugin = ({ options = {}, cb }) => {
  let messages = [];
  let currentMessage = '';

  const addCurrentMessage = () => {
    if (currentMessage.trim()) {
      messages.push({ type: 'message', content: currentMessage });
      currentMessage = '';
    }
  };
  const updateMessages = () => {
    cb(
      [
        ...messages,
        currentMessage ? { type: 'message', content: currentMessage } : null,
      ].filter(Boolean)
    );
  };

  return {
    on: {
      reset: () => {
        messages = [];
        currentMessage = '';
      },
      message: data => {
        console.log('[TEXT]', data.delta);
        currentMessage += data.delta;
        updateMessages();
      },
      shortcode: data => {
        console.log('[SHORTCODE]', data.content);
        addCurrentMessage();
        messages.push({ type: 'shortcode', content: data.content });
      },
      done: data => {
        if (currentMessage.trim()) {
          addCurrentMessage();
        }
      },
      ...options,
    },
  };
};
