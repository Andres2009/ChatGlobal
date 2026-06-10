import { useState } from 'react';
import { DEFAULT_ROOMS, getThemeClass } from '../config/rooms';

const MAX_ALIAS_LENGTH = 30;

export default function LoginModal({ onJoin, isConnected, rooms }) {
  const [alias, setAlias] = useState('');
  const availableRooms = rooms.length ? rooms : DEFAULT_ROOMS;
  const [selectedRoomId, setSelectedRoomId] = useState(availableRooms[0]?.id ?? 'general');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const trimmed = alias.trim();
    if (!trimmed) {
      setError('El alias no puede estar vacío.');
      return;
    }
    if (trimmed.length > MAX_ALIAS_LENGTH) {
      setError(`El alias no puede superar ${MAX_ALIAS_LENGTH} caracteres.`);
      return;
    }
    if (!selectedRoomId) {
      setError('Debes seleccionar una sala.');
      return;
    }
    if (!isConnected) {
      setError('Sin conexión al servidor. Intenta de nuevo en unos segundos.');
      return;
    }

    setIsSubmitting(true);
    const result = await onJoin(trimmed, selectedRoomId);
    setIsSubmitting(false);

    if (!result?.success) {
      setError(result?.error ?? 'No se pudo ingresar al chat.');
    }
  };

  return (
    <div className="login-modal-backdrop">
      <div className="login-modal card shadow-lg border-0 animate-fade-in">
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="login-icon mb-3">
              <i className="bi bi-chat-dots-fill" />
            </div>
            <h1 className="h3 mb-2">Bienvenido al Chat</h1>
            <p className="text-muted mb-0">Elige una sala, ingresa tu nombre y comienza a chatear.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="form-label fw-semibold">Selecciona una sala</label>
              <div className="room-selector">
                {availableRooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    className={`room-card ${getThemeClass(room.theme)} ${selectedRoomId === room.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRoomId(room.id)}
                  >
                    <div className="room-card-icon">
                      <i className={`bi ${room.icon}`} />
                    </div>
                    <div className="room-card-body">
                      <strong>{room.name}</strong>
                      <small>{room.topic}</small>
                      <span className="room-card-users">{room.userCount ?? 0} en línea</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="alias" className="form-label fw-semibold">
                Ingrese su nombre
              </label>
              <input
                id="alias"
                type="text"
                className={`form-control form-control-lg ${error ? 'is-invalid' : ''}`}
                placeholder="Oscar"
                value={alias}
                onChange={(event) => {
                  setAlias(event.target.value);
                  if (error) setError('');
                }}
                maxLength={MAX_ALIAS_LENGTH}
                autoFocus
                disabled={isSubmitting}
              />
              {error && <div className="invalid-feedback d-block">{error}</div>}
              <div className="form-text text-end">{alias.trim().length}/{MAX_ALIAS_LENGTH}</div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100"
              disabled={isSubmitting || !isConnected}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Conectando...
                </>
              ) : (
                'Entrar al chat'
              )}
            </button>

            <div className="connection-status mt-3 text-center">
              <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
              <small className="text-muted ms-1">
                {isConnected ? 'Servidor en línea' : 'Conectando al servidor...'}
              </small>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
