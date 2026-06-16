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
  const { socket, isConnected, connectionStatus } = useSocket();
  const [messages,     setMessages]     = useState([]);
  const [users,        setUsers]        = useState([]);
  const [rooms,        setRooms]        = useState([]);
  const [currentUser,  setCurrentUser]  = useState(null);
  const [currentRoom,  setCurrentRoom]  = useState(null);
  const [isJoined,     setIsJoined]     = useState(false);
  const [toasts,       setToasts]       = useState([]);
  const [typingUsers,  setTypingUsers]  = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const toastIdRef      = useRef(0);
  const currentUserRef  = useRef(null);
  const pendingSeenIds  = useRef(new Set());
  const seenTimerRef    = useRef(null);
  const lastJoinDataRef = useRef(null);   // { username, roomId } — used for auto-rejoin
  const isJoinedRef     = useRef(false);  // mirror of isJoined for use inside event handlers

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

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { isJoinedRef.current = isJoined; },      [isJoined]);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  // ── Request history (manual refresh button) ──────────────────────────────
  const requestHistory = useCallback(() => {
    if (!isJoinedRef.current) return;
    socket.emit('request-history', (response) => {
      if (response?.success) {
        setMessages(response.messages ?? []);
        setUsers(response.users ?? []);
        setLastSyncTime(new Date());
      }
    });
  }, [socket]);

  // ── Join ─────────────────────────────────────────────────────────────────
  const joinChat = useCallback(
    (username, roomId) =>
      new Promise((resolve) => {
        const sanitized = sanitizeClientText(username);
        if (!sanitized) {
          resolve({ success: false, error: 'El alias no puede estar vacío.' });
          return;
        }
        if (sanitized.length > MAX_ALIAS_LENGTH) {
          resolve({ success: false, error: `El alias no puede superar ${MAX_ALIAS_LENGTH} caracteres.` });
          return;
        }
        if (!roomId) {
          resolve({ success: false, error: 'Debes seleccionar una sala.' });
          return;
        }

        socket.emit('join-chat', { username: sanitized, roomId }, (response) => {
          if (response?.success) {
            lastJoinDataRef.current = { username: sanitized, roomId };
            setCurrentUser(response.user);
            setCurrentRoom(response.room);
            setIsJoined(true);
            setLastSyncTime(new Date());
            requestPermission();
          }
          resolve(response ?? { success: false, error: 'No se pudo unir al chat.' });
        });
      }),
    [socket, requestPermission]
  );

  // ── Send ─────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (content, replyToMessageId = null, imageUrl = null, isSticker = false) =>
      new Promise((resolve) => {
        const sanitized = sanitizeClientText(content);
        if (!sanitized && !imageUrl) {
          resolve({ success: false, error: 'El mensaje no puede estar vacío.' });
          return;
        }
        if (sanitized && sanitized.length > MAX_MESSAGE_LENGTH) {
          resolve({ success: false, error: `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.` });
          return;
        }

        socket.emit(
          'send-message',
          { content: sanitized, replyToMessageId, imageUrl, isSticker },
          (response) => {
            resolve(response ?? { success: false, error: 'No se pudo enviar el mensaje.' });
          }
        );
      }),
    [socket]
  );

  const startTyping = useCallback(() => socket.emit('typing-start'), [socket]);
  const stopTyping  = useCallback(() => socket.emit('typing-stop'),  [socket]);

  // ── Switch room ───────────────────────────────────────────────────────────
  const switchRoom = useCallback(
    (roomId) =>
      new Promise((resolve) => {
        socket.emit('switch-room', { roomId }, (response) => {
          if (response?.success && lastJoinDataRef.current) {
            lastJoinDataRef.current = { ...lastJoinDataRef.current, roomId };
          }
          resolve(response ?? { success: false, error: 'No se pudo cambiar de sala.' });
        });
      }),
    [socket]
  );

  // ── Mark seen ─────────────────────────────────────────────────────────────
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

  // ── Edit ─────────────────────────────────────────────────────────────────
  const editMessage = useCallback(
    (messageId, content) =>
      new Promise((resolve) => {
        const sanitized = sanitizeClientText(content);
        if (!sanitized) {
          resolve({ success: false, error: 'El mensaje no puede estar vacío.' });
          return;
        }
        if (sanitized.length > MAX_MESSAGE_LENGTH) {
          resolve({ success: false, error: `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.` });
          return;
        }

        socket.emit('edit-message', { messageId, content: sanitized }, (response) => {
          resolve(response ?? { success: false, error: 'No se pudo editar el mensaje.' });
        });
      }),
    [socket]
  );

  // ── Incoming message notification ─────────────────────────────────────────
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

  // ── Socket event listeners ────────────────────────────────────────────────
  useEffect(() => {
    const onRoomsList = ({ rooms: availableRooms }) => {
      setRooms(availableRooms ?? []);
    };

    const onHistoryLoaded = ({ messages: history, users: connectedUsers, currentUser: user, room }) => {
      setMessages(history ?? []);
      setUsers(connectedUsers ?? []);
      setCurrentUser(user);
      setCurrentRoom(room);
      setIsJoined(true);
      setTypingUsers([]);
      setLastSyncTime(new Date());
      clearNotifications();
    };

    const onReceiveMessage = ({ message }) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      setTypingUsers((prev) => prev.filter((u) => u.userId !== message.userId));
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
      setMessages((prev) => {
        if (prev.some((m) => m.id === systemMessage.id)) return prev;
        return [...prev, systemMessage];
      });
      showToast(`${user.username} se unió a la sala`, 'join');
    };

    const onUserLeft = ({ user, systemMessage, roomId }) => {
      if (currentRoom && roomId !== currentRoom.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === systemMessage.id)) return prev;
        return [...prev, systemMessage];
      });
      setTypingUsers((prev) => prev.filter((u) => u.userId !== user.id));
      showToast(`${user.username} abandonó la sala`, 'leave');
    };

    const onUserTyping = ({ userId, username, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.some((u) => u.userId === userId) ? prev : [...prev, { userId, username }];
        }
        return prev.filter((u) => u.userId !== userId);
      });
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

    socket.on('rooms-list',           onRoomsList);
    socket.on('history-loaded',       onHistoryLoaded);
    socket.on('receive-message',      onReceiveMessage);
    socket.on('message-edited',       onMessageEdited);
    socket.on('users-updated',        onUsersUpdated);
    socket.on('user-joined',          onUserJoined);
    socket.on('user-left',            onUserLeft);
    socket.on('mention-notification', onMentionNotification);
    socket.on('messages-seen',        onMessagesSeen);
    socket.on('user-typing',          onUserTyping);

    socket.emit('get-rooms');

    return () => {
      socket.off('rooms-list',           onRoomsList);
      socket.off('history-loaded',       onHistoryLoaded);
      socket.off('receive-message',      onReceiveMessage);
      socket.off('message-edited',       onMessageEdited);
      socket.off('users-updated',        onUsersUpdated);
      socket.off('user-joined',          onUserJoined);
      socket.off('user-left',            onUserLeft);
      socket.off('mention-notification', onMentionNotification);
      socket.off('messages-seen',        onMessagesSeen);
      socket.off('user-typing',          onUserTyping);
    };
  }, [socket, showToast, currentRoom, handleIncomingMessage, pushNotification, clearNotifications]);

  // ── Auto-rejoin on reconnect ──────────────────────────────────────────────
  useEffect(() => {
    const onConnect = () => {
      if (!isJoinedRef.current || !lastJoinDataRef.current) return;

      socket.emit('join-chat', lastJoinDataRef.current, (response) => {
        if (response?.success) {
          showToast('Reconectado correctamente', 'success');
          setLastSyncTime(new Date());
        }
      });
    };

    const onDisconnect = () => {
      if (isJoinedRef.current) {
        showToast('Conexión perdida. Reconectando...', 'error');
      }
    };

    socket.on('connect',    onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect',    onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket, showToast]);

  // ── Window focus / visibility ─────────────────────────────────────────────
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
      connectionStatus,
      toasts,
      pendingCount,
      showBanner,
      lastNotification,
      notificationPermission: permission,
      typingUsers,
      lastSyncTime,
      joinChat,
      switchRoom,
      sendMessage,
      editMessage,
      markMessagesSeen,
      startTyping,
      stopTyping,
      showToast,
      clearNotifications,
      setShowBanner,
      requestPermission,
      requestHistory,
    }),
    [
      messages,
      users,
      rooms,
      currentUser,
      currentRoom,
      isJoined,
      isConnected,
      connectionStatus,
      toasts,
      pendingCount,
      showBanner,
      lastNotification,
      permission,
      typingUsers,
      lastSyncTime,
      joinChat,
      switchRoom,
      sendMessage,
      editMessage,
      markMessagesSeen,
      startTyping,
      stopTyping,
      showToast,
      clearNotifications,
      setShowBanner,
      requestPermission,
      requestHistory,
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
