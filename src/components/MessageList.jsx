import { useCallback, useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem';
import SystemMessage from './SystemMessage';

export default function MessageList({
  messages,
  currentUserId,
  currentUsername,
  onEditMessage,
  onQuoteMessage,
  onMarkSeen,
}) {
  const bottomRef     = useRef(null);
  const containerRef  = useRef(null);
  const [newCount,    setNewCount]    = useState(0);  // unseen new messages
  const isAtBottomRef = useRef(true);

  // Check if the user is scrolled near the bottom
  const checkBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const THRESHOLD = 120; // px from bottom considered "at bottom"
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < THRESHOLD;
  }, []);

  // When messages change:
  // - if user is at bottom → scroll down, reset counter
  // - if user scrolled up → show "+N nuevos" button
  const prevLengthRef = useRef(messages.length);
  useEffect(() => {
    const added = messages.length - prevLengthRef.current;
    prevLengthRef.current = messages.length;

    if (added <= 0) return; // edit or initial load

    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setNewCount(0);
    } else {
      // Only count user messages from others as "new"
      const lastAdded = messages.slice(-added);
      const otherNewCount = lastAdded.filter(
        (m) => m.type === 'user' && m.userId !== currentUserId
      ).length;
      if (otherNewCount > 0) setNewCount((n) => n + otherNewCount);
    }
  }, [messages, currentUserId]);

  // Initial scroll to bottom on mount
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewCount(0);
    isAtBottomRef.current = true;
  };

  return (
    <section
      ref={containerRef}
      className="message-list"
      aria-label="Mensajes del chat"
      onScroll={checkBottom}
    >
      {messages.length === 0 ? (
        <div className="empty-chat text-center text-muted">
          <i className="bi bi-chat-square-text display-6 d-block mb-3" />
          <p className="mb-0">Aún no hay mensajes. ¡Sé el primero en escribir!</p>
        </div>
      ) : (
        messages.map((message) =>
          message.type === 'system' ? (
            <SystemMessage key={message.id} message={message} />
          ) : (
            <MessageItem
              key={message.id}
              message={message}
              isOwner={message.userId === currentUserId || message.username === currentUsername}
              currentUsername={currentUsername}
              onEdit={onEditMessage}
              onQuote={onQuoteMessage}
              onMarkSeen={onMarkSeen}
            />
          )
        )
      )}
      <div ref={bottomRef} />

      {newCount > 0 && (
        <button
          type="button"
          className="new-messages-btn animate-fade-in"
          onClick={scrollToBottom}
        >
          <i className="bi bi-arrow-down" />
          {newCount} mensaje{newCount > 1 ? 's' : ''} nuevo{newCount > 1 ? 's' : ''}
        </button>
      )}
    </section>
  );
}
