/**
 * Animacja „pisania” odpowiedzi asystenta (słowo po słowie).
 */
export function animateReplyText(fullText, onUpdate, options = {}) {
  const text = String(fullText || "");
  const speedMs = options.speedMs ?? 18;
  const chunkWords = options.chunkWords !== false;

  if (!text.trim()) {
    onUpdate("");
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    if (!chunkWords) {
      let i = 0;
      const step = () => {
        if (i >= text.length) {
          resolve();
          return;
        }
        i += Math.min(3, text.length - i);
        onUpdate(text.slice(0, i));
        setTimeout(step, speedMs);
      };
      step();
      return;
    }

    const tokens = text.split(/(\s+)/);
    let built = "";
    let idx = 0;

    const step = () => {
      if (idx >= tokens.length) {
        onUpdate(text);
        resolve();
        return;
      }
      built += tokens[idx];
      idx += 1;
      onUpdate(built);
      setTimeout(step, speedMs);
    };
    step();
  });
}
