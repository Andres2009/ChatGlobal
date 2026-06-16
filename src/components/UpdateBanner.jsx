export default function UpdateBanner({ show }) {
  if (!show) return null;

  return (
    <div className="update-banner" role="alert">
      <div className="update-banner-content">
        <i className="bi bi-stars" />
        <span>
          <strong>¡Nueva actualización!</strong> El chat ahora guarda el historial y se reconecta automáticamente.
        </span>
        <button
          type="button"
          className="btn btn-sm btn-light update-reload-btn"
          onClick={() => window.location.reload()}
        >
          Aplicar ahora
        </button>
      </div>
    </div>
  );
}
