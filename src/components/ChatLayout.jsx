import { useState } from 'react';
import { getThemeClass } from '../config/rooms';
import { useChatContext } from '../context/ChatContext';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import NotificationBanner from './NotificationBanner';
import OnlineUsers from './OnlineUsers';

export default function ChatLayout() {
  const {
    messages,
    users,
    currentUser,
    currentRoom,
    isConnected,
    pendingCount,
    showBanner,
    lastNotification,
    sendMessage,
    editMessage,
    clearNotifications,
  } = useChatContext();

  const [quotedMessage, setQuotedMessage] = useState(null);
  const themeClass = getThemeClass(currentRoom?.theme);

  const handleQuote = (message) => {
    setQuotedMessage(message);
  };

  return (
    <div className={`chat-app ${themeClass}`}>
      <NotificationBanner
        show={showBanner}
        pendingCount={pendingCount}
        lastNotification={lastNotification}
        onDismiss={clearNotifications}
        onView={() => {
          clearNotifications();
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }}
      />

      <header className="chat-header">
        <div className="chat-header-brand">
          <i className={`bi ${currentRoom?.icon ?? 'bi-hash'}`} />
          <div>
            <h1 className="h5 mb-0">{currentRoom?.name ?? 'Sala'}</h1>
            <small className="text-muted">{currentRoom?.topic ?? 'Chat en tiempo real'}</small>
          </div>
        </div>
        <div className="chat-header-status">
          {pendingCount > 0 && (
            <span className="badge bg-danger me-2 notification-badge">
              <i className="bi bi-bell-fill me-1" />
              {pendingCount}
            </span>
          )}
          <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
          <span className="small">{isConnected ? 'En línea' : 'Desconectado'}</span>
          <span className="badge bg-secondary-subtle text-secondary ms-2 d-none d-sm-inline">
            {users.length} conectados
          </span>
        </div>
      </header>

      <div className="chat-body">
        <main className="chat-main">
          <MessageList
            messages={messages}
            currentUserId={currentUser?.id}
            currentUsername={currentUser?.username}
            onEditMessage={editMessage}
            onQuoteMessage={handleQuote}
          />
          <MessageInput
            onSend={sendMessage}
            disabled={!isConnected}
            users={users}
            currentUserId={currentUser?.id}
            quotedMessage={quotedMessage}
            onClearQuote={() => setQuotedMessage(null)}
          />
        </main>

        <OnlineUsers users={users} currentUserId={currentUser?.id} />
      </div>
    </div>
  );
}
