import { useState } from 'react';
import { formatDateTime, formatTime } from '../utils/formatDate';
import { renderMessageWithMentions } from '../utils/mentions';
import QuoteBlock from './QuoteBlock';

const MAX_MESSAGE_LENGTH = 2000;

function MessageContent({ content, currentUsername }) {
  const parts = renderMessageWithMentions(content, currentUsername);

  return (
    <p className="message-content">
      {parts.map((part, index) =>
        part.type === 'mention' ? (
          <span key={`${part.value}-${index}`} className={`mention-tag ${part.isSelf ? 'is-self' : ''}`}>
            {part.value}
          </span>
        ) : (
          <span key={`text-${index}`}>{part.value}</span>
        )
      )}
    </p>
  );
}

export default function MessageItem({
  message,
  isOwner,
  onEdit,
  onQuote,
  currentUsername,
}) {
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
    <article className={`message-item animate-slide-in ${isOwner ? 'is-own' : 'is-other'}`}>
      {!isOwner && (
        <div className="message-avatar">{message.username.charAt(0).toUpperCase()}</div>
      )}

      <div className="message-bubble-wrap">
        <div className={`message-bubble ${isOwner ? 'own' : 'other'}`}>
          {!isOwner && <strong className="message-username">{message.username}</strong>}

          {message.replyTo && (
            <QuoteBlock replyTo={message.replyTo} currentUsername={currentUsername} compact />
          )}

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
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <MessageContent content={message.content} currentUsername={currentUsername} />
          )}

          <footer className="message-footer">
            <time className="message-time" dateTime={message.createdAt} title={formatDateTime(message.createdAt)}>
              {formatTime(message.createdAt)}
            </time>
            {message.isEdited && (
              <span className="message-edited-label"> · editado {formatTime(message.updatedAt)}</span>
            )}
          </footer>
        </div>

        {!isEditing && (
          <div className="message-actions">
            <button
              type="button"
              className="btn btn-sm btn-link message-action-btn"
              onClick={() => onQuote(message)}
              title="Citar mensaje"
            >
              <i className="bi bi-reply-fill" />
            </button>
            {isOwner && (
              <button
                type="button"
                className="btn btn-sm btn-link message-action-btn"
                onClick={() => setIsEditing(true)}
                title="Editar mensaje"
              >
                <i className="bi bi-pencil" />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
