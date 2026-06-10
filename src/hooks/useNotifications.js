import { useCallback, useEffect, useRef, useState } from 'react';

export function useNotifications(currentRoom) {
  const [pendingCount, setPendingCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const isHiddenRef = useRef(false);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied';
    if (Notification.permission === 'granted') {
      setPermission('granted');
      return 'granted';
    }
    if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return Notification.permission;
  }, []);

  const pushNotification = useCallback(
    ({ title, body, isMention = false }) => {
      setLastNotification({ title, body, isMention, at: Date.now() });

      if (isHiddenRef.current) {
        setPendingCount((count) => count + 1);
        setShowBanner(true);

        if (permission === 'granted' && typeof Notification !== 'undefined') {
          const notification = new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'chatglobal-notification',
          });
          notification.onclick = () => window.focus();
        }
      }
    },
    [permission]
  );

  const clearNotifications = useCallback(() => {
    setPendingCount(0);
    setShowBanner(false);
    setLastNotification(null);
    document.title = currentRoom ? `${currentRoom.name} · ChatGlobal` : 'ChatGlobal';
  }, [currentRoom]);

  useEffect(() => {
    const onVisibilityChange = () => {
      const hidden = document.hidden;
      isHiddenRef.current = hidden;

      if (!hidden && pendingCount > 0) {
        setShowBanner(true);
      }

      if (!hidden) {
        document.title = currentRoom ? `${currentRoom.name} · ChatGlobal` : 'ChatGlobal';
      }
    };

    isHiddenRef.current = document.hidden;
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [pendingCount, currentRoom]);

  useEffect(() => {
    if (pendingCount > 0 && isHiddenRef.current) {
      document.title = `(${pendingCount}) Nueva actividad · ChatGlobal`;
    }
  }, [pendingCount]);

  return {
    pendingCount,
    showBanner,
    lastNotification,
    permission,
    requestPermission,
    pushNotification,
    clearNotifications,
    setShowBanner,
  };
}
