import MessageInput from './MessageInput';
import MessageList from './MessageList';
import OnlineUsers from './OnlineUsers';
import { useChatContext } from '../context/ChatContext';

export default function ChatLayout() {
  const { messages, users, currentUser, isConnected, sendMessage, editMessage } = useChatContext();

  return (
    <div className="chat-app">
      <header className="chat-header">
        <div className="chat-header-brand">
          <i className="bi bi-hash" />
          <div>
            <h1 className="h5 mb-0">Sala General</h1>
            <small className="text-muted">Chat en tiempo real</small>
          </div>
        </div>
        <div className="chat-header-status">
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
            onEditMessage={editMessage}
          />
          <MessageInput onSend={sendMessage} disabled={!isConnected} />
        </main>

        <OnlineUsers users={users} currentUserId={currentUser?.id} />
      </div>
    </div>
  );
}
