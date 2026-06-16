import { useEffect, useRef, useState } from 'react';
import { getThemeClass } from '../config/rooms';
import { useChatContext } from '../context/ChatContext';
import { formatTime } from '../utils/formatDate';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import NotificationBanner from './NotificationBanner';
import OnlineUsers from './OnlineUsers';
import TypingIndicator from './TypingIndicator';

const CONNECTION_LABELS = {
  connected:    { dot: 'online',        text: 'Conectado' },
  reconnecting: { dot: 'reconnecting',  text: 'Reconectando...' },
  disconnected: { dot: 'offline',       text: 'Sin conexión' },
};

export default function ChatLayout() {
  const {
    messages,
    users,
    rooms,
    currentUser,
    currentRoom,
    connectionStatus,
    pendingCount,
    showBanner,
    lastNotification,
    lastSyncTime,
    sendMessage,
    editMessage,
    markMessagesSeen,
    typingUsers,
    startTyping,
    stopTyping,
    switchRoom,
    clearNotifications,
    requestHistory,
  } = useChatContext();

  const [quotedMessage,   setQuotedMessage]   = useState(null);
  const [showUsers,       setShowUsers]        = useState(false);
  const [showRoomPicker,  setShowRoomPicker]   = useState(false);
  const [switching,       setSwitching]        = useState(false);
  const [refreshing,      setRefreshing]       = useState(false);
  const roomPickerRef = useRef(null);

  const themeClass = getThemeClass(currentRoom?.theme);
  const { dot, text } = CONNECTION_LABELS[connectionStatus] ?? CONNECTION_LABELS.disconnected;
  const isConnected = connectionStatus === 'connected';

  const handleQuote = (message) => setQuotedMessage(message);

  const handleSwitchRoom = async (roomId) => {
    if (roomId === currentRoom?.id || switching) return;
    setShowRoomPicker(false);
    setSwitching(true);
    await switchRoom(roomId);
    setSwitching(false);
  };

  const handleRefresh = async () => {
    if (refreshing || !isConnected) return;
    setRefreshing(true);
    requestHistory();
    setTimeout(() => setRefreshing(false), 800);
  };

  // Close room picker when clicking outside
  useEffect(() => {
    if (!showRoomPicker) return;
    const handler = (e) => {
      if (!roomPickerRef.current?.contains(e.target)) setShowRoomPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRoomPicker]);

  const otherRooms = rooms.filter((r) => r.id !== currentRoom?.id);

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
        {/* ── Brand: current room + room switcher ── */}
        <div className="chat-header-brand">
          <i className={`bi ${currentRoom?.icon ?? 'bi-hash'}`} />
          <div style={{ minWidth: 0 }}>
            <h1 className="h5 mb-0">{currentRoom?.name ?? 'Sala'}</h1>
            <small className="text-muted d-none d-sm-block">{currentRoom?.topic ?? 'Chat en tiempo real'}</small>
          </div>

          {/* Room picker */}
          {otherRooms.length > 0 && (
            <div className="room-picker-wrap" ref={roomPickerRef}>
              <button
                type="button"
                className="btn btn-sm btn-link room-picker-trigger"
                onClick={() => setShowRoomPicker((v) => !v)}
                title="Cambiar de sala"
                disabled={switching}
              >
                {switching
                  ? <span className="spinner-border spinner-border-sm" />
                  : <i className="bi bi-grid-3x3-gap-fill" />
                }
              </button>
              {showRoomPicker && (
                <div className="room-picker-dropdown animate-fade-in">
                  <p className="room-picker-label">Cambiar de sala</p>
                  {otherRooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      className="room-picker-item"
                      onClick={() => handleSwitchRoom(room.id)}
                    >
                      <i className={`bi ${room.icon} room-picker-icon`} />
                      <span className="room-picker-name">{room.name}</span>
                      <span className="room-picker-count">{room.userCount ?? 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right side ── */}
        <div className="chat-header-status">
          {pendingCount > 0 && (
            <span className="badge bg-danger notification-badge">
              <i className="bi bi-bell-fill me-1" />
              {pendingCount}
            </span>
          )}

          {/* Connection indicator */}
          <span className={`status-dot ${dot}`} />
          <span className="small status-text">{text}</span>

          {/* Last sync time */}
          {lastSyncTime && (
            <span
              className="sync-time d-none d-lg-inline"
              title={`Última sincronización: ${formatTime(lastSyncTime.toISOString())}`}
            >
              <i className="bi bi-clock me-1" />
              {formatTime(lastSyncTime.toISOString())}
            </span>
          )}

          {/* Refresh button */}
          <button
            type="button"
            className={`btn btn-sm refresh-chat-btn${refreshing ? ' refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={!isConnected || refreshing}
            title="Actualizar historial del chat"
            aria-label="Actualizar chat"
          >
            <i className="bi bi-arrow-clockwise" />
            <span className="d-none d-md-inline ms-1">Actualizar</span>
          </button>

          {/* User profile chip */}
          {currentUser && (
            <div className="header-user-chip" title={`Conectado como ${currentUser.username}`}>
              <span className="header-user-avatar">
                {currentUser.username.charAt(0).toUpperCase()}
              </span>
              <span className="header-user-name d-none d-md-inline">
                {currentUser.username}
              </span>
            </div>
          )}

          <span className="badge bg-secondary-subtle text-secondary d-none d-lg-inline">
            {users.length} conectados
          </span>

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
          <TypingIndicator typingUsers={typingUsers} />
          <MessageInput
            onSend={sendMessage}
            disabled={!isConnected}
            users={users}
            currentUserId={currentUser?.id}
            quotedMessage={quotedMessage}
            onClearQuote={() => setQuotedMessage(null)}
            onTypingStart={startTyping}
            onTypingStop={stopTyping}
          />
        </main>

        <OnlineUsers
          users={users}
          currentUserId={currentUser?.id}
          isVisible={showUsers}
        />
      </div>
    </div>
  );
}
