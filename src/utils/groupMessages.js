// Funkcja do grupowania wiadomości (jak w Messenger/WhatsApp)
export function groupMessages(messages, currentUserId) {
  if (!messages || messages.length === 0) return [];

  const grouped = [];
  const GROUP_TIME_THRESHOLD = 5 * 60 * 1000; // 5 minut

  for (let i = 0; i < messages.length; i++) {
    const current = messages[i];
    const prev = i > 0 ? messages[i - 1] : null;

    const isMine = String(current.sender?._id || current.sender) === String(currentUserId);
    const prevIsMine = prev ? String(prev.sender?._id || prev.sender) === String(currentUserId) : false;
    const sameSender = prev && String(current.sender?._id || current.sender) === String(prev.sender?._id || prev.sender);
    const timeDiff = prev ? new Date(current.createdAt) - new Date(prev.createdAt) : Infinity;

    // Sprawdź czy powinna być zgrupowana z poprzednią
    const shouldGroup = sameSender && timeDiff < GROUP_TIME_THRESHOLD;

    grouped.push({
      ...current,
      grouped: shouldGroup,
      showAvatar: !shouldGroup,
      showName: !shouldGroup && !isMine
    });
  }

  return grouped;
}

// Funkcja do dodawania separatorów dat
export function addDateSeparators(groupedMessages) {
  if (!groupedMessages || groupedMessages.length === 0) return [];

  const withSeparators = [];
  let lastDate = null;

  for (const msg of groupedMessages) {
    const msgDate = new Date(msg.createdAt);
    const dateKey = msgDate.toDateString();

    // Sprawdź czy to nowy dzień
    if (lastDate !== dateKey) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label = '';
      if (dateKey === today.toDateString()) {
        label = 'Dzisiaj';
      } else if (dateKey === yesterday.toDateString()) {
        label = 'Wczoraj';
      } else {
        label = msgDate.toLocaleDateString('pl-PL', { 
          day: 'numeric', 
          month: 'long',
          year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }

      withSeparators.push({
        _id: `separator-${dateKey}`,
        type: 'separator',
        label,
        date: dateKey
      });

      lastDate = dateKey;
    }

    withSeparators.push(msg);
  }

  return withSeparators;
}

