import { useEffect, useRef, useState } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';

export function useSocket() {
  // 'connected' | 'reconnecting' | 'disconnected'
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => {
      wasConnectedRef.current = true;
      setConnectionStatus('connected');
    };

    const onDisconnect = () => {
      setConnectionStatus(wasConnectedRef.current ? 'reconnecting' : 'disconnected');
    };

    const onReconnectAttempt = () => {
      setConnectionStatus('reconnecting');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);

    if (socket.connected) {
      wasConnectedRef.current = true;
      setConnectionStatus('connected');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      disconnectSocket();
    };
  }, []);

  return {
    socket: getSocket(),
    isConnected: connectionStatus === 'connected',
    connectionStatus,
  };
}
