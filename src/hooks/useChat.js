import { useCallback } from 'react';
import { useChatContext } from '../context/ChatContext';

export function useChat() {
  const {
    messages,
    users,
    currentUser,
    isJoined,
    isConnected,
    joinChat,
    sendMessage,
    editMessage,
    showToast,
  } = useChatContext();

  const handleJoin = useCallback(
    (username) => joinChat(username),
    [joinChat]
  );

  const handleSend = useCallback(
    (content) => sendMessage(content),
    [sendMessage]
  );

  const handleEdit = useCallback(
    (messageId, content) => editMessage(messageId, content),
    [editMessage]
  );

  return {
    messages,
    users,
    currentUser,
    isJoined,
    isConnected,
    joinChat: handleJoin,
    sendMessage: handleSend,
    editMessage: handleEdit,
    showToast,
  };
}
