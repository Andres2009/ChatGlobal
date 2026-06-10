import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

const ChatContext = createContext(null);

const MAX_ALIAS_LENGTH = 30;
const MAX_MESSAGE_LENGTH = 2000;

function sanitizeClientText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '').trim();
}

export function ChatProvider({ children }) {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const joinChat = useCallback(
    (username) =>
      new Promise((resolve) => {
        const sanitized = sanitizeClientText(username);
        if (!sanitized) {
          resolve({ success: false, error: 'El alias no puede estar vacío.' });
          return;
        }
        if (sanitized.length > MAX_ALIAS_LENGTH) {
          resolve({
            success: false,
            error: `El alias no puede superar ${MAX_ALIAS_LENGTH} caracteres.`,
          });
          return;
        }

        socket.emit('join-chat', { username: sanitized }, (response) => {
          if (response?.success) {
            setCurrentUser(response.user);
            setIsJoined(true);
          }
          resolve(response ?? { success: false, error: 'No se pudo unir al chat.' });
        });
      }),
    [socket]
  );

  const sendMessage = useCallback(
    (content) =>
      new Promise((resolve) => {
        const sanitized = sanitizeClientText(content);
        if (!sanitized) {
          resolve({ success: false, error: 'El mensaje no puede estar vacío.' });
          return;
        }
        if (sanitized.length > MAX_MESSAGE_LENGTH) {
          resolve({
            success: false,
            error: `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`,
          });
          return;
        }

        socket.emit('send-message', { content: sanitized }, (response) => {
          resolve(response ?? { success: false, error: 'No se pudo enviar el mensaje.' });
        });
      }),
    [socket]
  );

  const editMessage = useCallback(
    (messageId, content) =>
      new Promise((resolve) => {
        const sanitized = sanitizeClientText(content);
        if (!sanitized) {
          resolve({ success: false, error: 'El mensaje no puede estar vacío.' });
          return;
        }
        if (sanitized.length > MAX_MESSAGE_LENGTH) {
          resolve({
            success: false,
            error: `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`,
          });
          return;
        }

        socket.emit('edit-message', { messageId, content: sanitized }, (response) => {
          resolve(response ?? { success: false, error: 'No se pudo editar el mensaje.' });
        });
      }),
    [socket]
  );

  useEffect(() => {
    const onHistoryLoaded = ({ messages: history, users: connectedUsers, currentUser: user }) => {
      setMessages(history);
      setUsers(connectedUsers);
      setCurrentUser(user);
      setIsJoined(true);
    };

    const onReceiveMessage = ({ message }) => {
      setMessages((prev) => [...prev, message]);
    };

    const onMessageEdited = ({ message }) => {
      setMessages((prev) => prev.map((item) => (item.id === message.id ? message : item)));
    };

    const onUsersUpdated = ({ users: connectedUsers }) => {
      setUsers(connectedUsers);
    };

    const onUserJoined = ({ user, systemMessage }) => {
      setMessages((prev) => [...prev, systemMessage]);
      showToast(`${user.username} se unió al chat`, 'join');
    };

    const onUserLeft = ({ user, systemMessage }) => {
      setMessages((prev) => [...prev, systemMessage]);
      showToast(`${user.username} abandonó el chat`, 'leave');
    };

    socket.on('history-loaded', onHistoryLoaded);
    socket.on('receive-message', onReceiveMessage);
    socket.on('message-edited', onMessageEdited);
    socket.on('users-updated', onUsersUpdated);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);

    return () => {
      socket.off('history-loaded', onHistoryLoaded);
      socket.off('receive-message', onReceiveMessage);
      socket.off('message-edited', onMessageEdited);
      socket.off('users-updated', onUsersUpdated);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
    };
  }, [socket, showToast]);

  const value = useMemo(
    () => ({
      messages,
      users,
      currentUser,
      isJoined,
      isConnected,
      toasts,
      joinChat,
      sendMessage,
      editMessage,
      showToast,
    }),
    [
      messages,
      users,
      currentUser,
      isJoined,
      isConnected,
      toasts,
      joinChat,
      sendMessage,
      editMessage,
      showToast,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext debe usarse dentro de ChatProvider');
  }
  return context;
}
