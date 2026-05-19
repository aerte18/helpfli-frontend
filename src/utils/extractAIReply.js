/**
 * Wyciąga tekst dla użytkownika z odpowiedzi AI.
 * Zabezpieczenie gdy backend/model zwróci surowy JSON zamiast pola reply.
 */
export function extractAIReply(text) {
  if (text == null) return '';
  if (typeof text !== 'string') {
    if (typeof text?.reply === 'string') return extractAIReply(text.reply);
    return String(text);
  }

  const trimmed = text.trim();
  if (!trimmed) return '';

  const tryParse = (raw) => {
    try {
      return JSON.parse(raw);
    } catch {
      const fence = raw.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/i);
      if (fence) {
        try {
          return JSON.parse(fence[1]);
        } catch {
          return null;
        }
      }
      const first = raw.indexOf('{');
      const last = raw.lastIndexOf('}');
      if (first !== -1 && last > first) {
        try {
          return JSON.parse(raw.slice(first, last + 1));
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const parsed = tryParse(trimmed);
  if (parsed && typeof parsed.reply === 'string' && parsed.reply.trim()) {
    return extractAIReply(parsed.reply);
  }

  const wholeFence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (wholeFence) {
    const inner = extractAIReply(wholeFence[1]);
    if (inner && inner !== wholeFence[1].trim()) return inner;
  }

  return trimmed;
}

export function sanitizeHistoryContent(content) {
  const reply = extractAIReply(content);
  if (reply.startsWith('{') && reply.includes('"agent"') && reply.includes('"reply"')) {
    return extractAIReply(reply);
  }
  return reply;
}
