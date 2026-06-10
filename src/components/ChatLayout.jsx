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
    markMessagesSeen,
    clearNotifications,
  } = useChatContext();

  const [quotedMessage, setQuotedMessage]   = useState(null);
  const [showUsers,     setShowUsers]        = useState(false);
  const themeClass = getThemeClass(currentRoom?.theme);

  const handleQuote = (message) => setQuotedMessage(message);

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
        {/* ── Brand (room name + icon) ── */}
        <div className="chat-header-brand">
          <i className={`bi ${currentRoom?.icon ?? 'bi-hash'}`} />
          <div style={{ minWidth: 0 }}>
            <h1 className="h5 mb-0">{currentRoom?.name ?? 'Sala'}</h1>
            <small className="text-muted d-none d-sm-block">{currentRoom?.topic ?? 'Chat en tiempo real'}</small>
          </div>
        </div>

        {/* ── Right side: status + toggle ── */}
        <div className="chat-header-status">
          {/* Notification badge */}
          {pendingCount > 0 && (
            <span className="badge bg-danger notification-badge">
              <i className="bi bi-bell-fill me-1" />
              {pendingCount}
            </span>
          )}

          {/* Connection indicator */}
          <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
          <span className="small status-text">{isConnected ? 'En línea' : 'Sin conexión'}</span>

          {/* Desktop: user count badge */}
          <span className="badge bg-secondary-subtle text-secondary d-none d-lg-inline">
            {users.length} conectados
          </span>

          {/* Mobile/tablet: toggle users panel button */}
          <button
            type="button"
            className={`btn btn-sm users-toggle-btn ${showUsers ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setShowUsers((v) => !v)}
            title={showUsers ? 'Ocultar usuarios' : 'Ver usuarios conectados'}
            aria-label="Usuarios conectados"
          >
            <i className="bi bi-people-fill" />
            <span
              className="badge rounded-pill ms-1"
              style={{ background: showUsers ? 'rgba(255,255,255,.3)' : 'var(--chat-primary)', color: '#fff', fontSize: '0.65rem' }}
            >
              {users.length}
            </span>
          </button>
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
            onMarkSeen={markMessagesSeen}
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

        {/* Pass showUsers so the panel can hide itself on mobile */}
        <OnlineUsers
          users={users}
          currentUserId={currentUser?.id}
          isVisible={showUsers}
        />
      </div>
    </div>
  );
}
