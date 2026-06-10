import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
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
  const [rooms, setRooms] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const currentUserRef = useRef(null);
  const pendingSeenIds = useRef(new Set());
  const seenTimerRef = useRef(null);

  const {
    pendingCount,
    showBanner,
    lastNotification,
    permission,
    requestPermission,
    pushNotification,
    clearNotifications,
    setShowBanner,
  } = useNotifications(currentRoom);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const joinChat = useCallback(
    (username, roomId) =>
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
        if (!roomId) {
          resolve({ success: false, error: 'Debes seleccionar una sala.' });
          return;
        }

        socket.emit('join-chat', { username: sanitized, roomId }, (response) => {
          if (response?.success) {
            setCurrentUser(response.user);
            setCurrentRoom(response.room);
            setIsJoined(true);
            requestPermission();
          }
          resolve(response ?? { success: false, error: 'No se pudo unir al chat.' });
        });
      }),
    [socket, requestPermission]
  );

  const sendMessage = useCallback(
    (content, replyToMessageId = null) =>
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

        socket.emit(
          'send-message',
          { content: sanitized, replyToMessageId },
          (response) => {
            resolve(response ?? { success: false, error: 'No se pudo enviar el mensaje.' });
          }
        );
      }),
    [socket]
  );

  const markMessagesSeen = useCallback(
    (messageId) => {
      if (!isJoined) return;
      pendingSeenIds.current.add(messageId);
      clearTimeout(seenTimerRef.current);
      seenTimerRef.current = setTimeout(() => {
        const ids = [...pendingSeenIds.current];
        pendingSeenIds.current.clear();
        if (ids.length > 0) socket.emit('mark-seen', { messageIds: ids });
      }, 400);
    },
    [socket, isJoined]
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

  const handleIncomingMessage = useCallback(
    (message) => {
      const me = currentUserRef.current;
      if (!me || message.userId === me.id) return;

      const mentionedMe = (message.mentions ?? []).some((mention) => mention.id === me.id);
      if (mentionedMe) return;

      pushNotification({
        title: `Nuevo mensaje en ${currentRoom?.name ?? 'el chat'}`,
        body: `${message.username}: ${message.content}`,
        isMention: false,
      });
    },
    [currentRoom, pushNotification]
  );

  useEffect(() => {
    const onRoomsList = ({ rooms: availableRooms }) => {
      setRooms(availableRooms ?? []);
    };

    const onHistoryLoaded = ({ messages: history, users: connectedUsers, currentUser: user, room }) => {
      setMessages(history);
      setUsers(connectedUsers);
      setCurrentUser(user);
      setCurrentRoom(room);
      setIsJoined(true);
      clearNotifications();
    };

    const onReceiveMessage = ({ message }) => {
      setMessages((prev) => [...prev, message]);
      handleIncomingMessage(message);
    };

    const onMessageEdited = ({ message }) => {
      setMessages((prev) => prev.map((item) => (item.id === message.id ? message : item)));
    };

    const onUsersUpdated = ({ users: connectedUsers }) => {
      setUsers(connectedUsers);
    };

    const onUserJoined = ({ user, systemMessage, roomId }) => {
      if (currentRoom && roomId !== currentRoom.id) return;
      setMessages((prev) => [...prev, systemMessage]);
      showToast(`${user.username} se unió a la sala`, 'join');
    };

    const onUserLeft = ({ user, systemMessage, roomId }) => {
      if (currentRoom && roomId !== currentRoom.id) return;
      setMessages((prev) => [...prev, systemMessage]);
      showToast(`${user.username} abandonó la sala`, 'leave');
    };

    const onMessagesSeen = ({ messages: updatedMessages }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          const updated = updatedMessages.find((u) => u.id === msg.id);
          return updated ?? msg;
        })
      );
    };

    const onMentionNotification = ({ message, mentionedBy }) => {
      pushNotification({
        title: `${mentionedBy} te mencionó`,
        body: message.content,
        isMention: true,
      });
      showToast(`${mentionedBy} te mencionó en un mensaje`, 'mention');
    };

    socket.on('rooms-list', onRoomsList);
    socket.on('history-loaded', onHistoryLoaded);
    socket.on('receive-message', onReceiveMessage);
    socket.on('message-edited', onMessageEdited);
    socket.on('users-updated', onUsersUpdated);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('mention-notification', onMentionNotification);
    socket.on('messages-seen', onMessagesSeen);

    socket.emit('get-rooms');

    return () => {
      socket.off('rooms-list', onRoomsList);
      socket.off('history-loaded', onHistoryLoaded);
      socket.off('receive-message', onReceiveMessage);
      socket.off('message-edited', onMessageEdited);
      socket.off('users-updated', onUsersUpdated);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('mention-notification', onMentionNotification);
      socket.off('messages-seen', onMessagesSeen);
    };
  }, [socket, showToast, currentRoom, handleIncomingMessage, pushNotification, clearNotifications]);

  // Track window focus/visibility and broadcast to the room
  useEffect(() => {
    if (!isJoined) return;

    const emit = (active) => socket.emit('user-activity', { isActive: active });
    const onVisibility = () => emit(document.visibilityState === 'visible');
    const onFocus = () => emit(true);
    const onBlur  = () => emit(false);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur',  onBlur);
    emit(document.visibilityState === 'visible' && document.hasFocus());

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur',  onBlur);
    };
  }, [isJoined, socket]);

  const value = useMemo(
    () => ({
      messages,
      users,
      rooms,
      currentUser,
      currentRoom,
      isJoined,
      isConnected,
      toasts,
      pendingCount,
      showBanner,
      lastNotification,
      notificationPermission: permission,
      joinChat,
      sendMessage,
      editMessage,
      markMessagesSeen,
      showToast,
      clearNotifications,
      setShowBanner,
      requestPermission,
    }),
    [
      messages,
      users,
      rooms,
      currentUser,
      currentRoom,
      isJoined,
      isConnected,
      toasts,
      pendingCount,
      showBanner,
      lastNotification,
      permission,
      joinChat,
      sendMessage,
      editMessage,
      markMessagesSeen,
      showToast,
      clearNotifications,
      setShowBanner,
      requestPermission,
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
