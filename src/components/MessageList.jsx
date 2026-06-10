import { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import SystemMessage from './SystemMessage';

export default function MessageList({ messages, currentUserId, onEditMessage }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <section className="message-list" ref={containerRef} aria-label="Mensajes del chat">
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
              isOwner={message.userId === currentUserId}
              onEdit={onEditMessage}
            />
          )
        )
      )}
      <div ref={bottomRef} />
    </section>
  );
}
