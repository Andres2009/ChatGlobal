export default function NotificationBanner({
  show,
  pendingCount,
  lastNotification,
  onDismiss,
  onView,
}) {
  if (!show || pendingCount === 0) return null;

  const message =
    lastNotification?.body ??
    `Tienes ${pendingCount} notificación${pendingCount === 1 ? '' : 'es'} nueva${pendingCount === 1 ? '' : 's'}.`;

  return (
    <div className="notification-banner animate-fade-in" role="alert">
      <div className="notification-banner-content">
        <i className="bi bi-bell-fill me-2" />
        <div className="flex-grow-1">
          <strong>Nueva notificación</strong>
          <div className="small">{message}</div>
        </div>
        <button type="button" className="btn btn-sm btn-light me-2" onClick={onView}>
          Ver
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-light"
          onClick={onDismiss}
          aria-label="Cerrar notificación"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>
    </div>
  );
}
