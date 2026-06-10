import { useState } from 'react';
import { formatDateTime, formatTime } from '../utils/formatDate';

const MAX_MESSAGE_LENGTH = 2000;

export default function MessageItem({ message, isOwner, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setError('');
    const trimmed = editContent.trim();
    if (!trimmed) {
      setError('El mensaje no puede estar vacío.');
      return;
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(`El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`);
      return;
    }

    setIsSaving(true);
    const result = await onEdit(message.id, trimmed);
    setIsSaving(false);

    if (result?.success) {
      setIsEditing(false);
    } else {
      setError(result?.error ?? 'No se pudo editar el mensaje.');
    }
  };

  const handleCancel = () => {
    setEditContent(message.content);
    setError('');
    setIsEditing(false);
  };

  return (
    <article className={`message-item animate-slide-in ${isOwner ? 'is-owner' : ''}`}>
      <header className="message-header">
        <div className="message-avatar">{message.username.charAt(0).toUpperCase()}</div>
        <div className="message-meta">
          <strong className="message-username">{message.username}</strong>
          <time className="message-time" dateTime={message.createdAt} title={formatDateTime(message.createdAt)}>
            {formatTime(message.createdAt)}
          </time>
          <span className="message-date">{formatDateTime(message.createdAt)}</span>
          {message.isEdited && (
            <span className="message-edited-label">(Editado {formatTime(message.updatedAt)})</span>
          )}
        </div>
        {isOwner && !isEditing && (
          <button
            type="button"
            className="btn btn-sm btn-link message-edit-btn"
            onClick={() => setIsEditing(true)}
            title="Editar mensaje"
          >
            <i className="bi bi-pencil" />
          </button>
        )}
      </header>

      {isEditing ? (
        <div className="message-edit-form">
          <textarea
            className={`form-control ${error ? 'is-invalid' : ''}`}
            rows={3}
            value={editContent}
            onChange={(event) => {
              setEditContent(event.target.value);
              if (error) setError('');
            }}
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={isSaving}
          />
          {error && <div className="invalid-feedback d-block">{error}</div>}
          <div className="message-edit-actions">
            <button type="button" className="btn btn-sm btn-primary" onClick={handleSave} disabled={isSaving}>
              Guardar
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCancel} disabled={isSaving}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className="message-content">{message.content}</p>
      )}
    </article>
  );
}
