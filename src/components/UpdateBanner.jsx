export default function UpdateBanner({ show }) {
  if (!show) return null;

  return (
    <div className="update-banner" role="alert">
      <div className="update-banner-content">
        <i className="bi bi-arrow-clockwise" />
        <span>Nueva versión disponible.</span>
        <button
          type="button"
          className="btn btn-sm btn-light update-reload-btn"
          onClick={() => window.location.reload()}
        >
          Actualizar ahora
        </button>
      </div>
    </div>
  );
}
