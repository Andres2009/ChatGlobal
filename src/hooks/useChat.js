import { useCallback } from 'react';
import { useChatContext } from '../context/ChatContext';

export function useChat() {
  const {
    messages,
    users,
    rooms,
    currentUser,
    currentRoom,
    isJoined,
    isConnected,
    joinChat,
    sendMessage,
    editMessage,
    showToast,
    pendingCount,
    clearNotifications,
  } = useChatContext();

  const handleJoin = useCallback(
    (username, roomId) => joinChat(username, roomId),
    [joinChat]
  );

  const handleSend = useCallback(
    (content, replyToMessageId, imageUrl) => sendMessage(content, replyToMessageId, imageUrl),
    [sendMessage]
  );

  const handleEdit = useCallback(
    (messageId, content) => editMessage(messageId, content),
    [editMessage]
  );

  return {
    messages,
    users,
    rooms,
    currentUser,
    currentRoom,
    isJoined,
    isConnected,
    pendingCount,
    joinChat: handleJoin,
    sendMessage: handleSend,
    editMessage: handleEdit,
    showToast,
    clearNotifications,
  };
}
