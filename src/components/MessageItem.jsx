import { useEffect, useRef, useState } from 'react';
import { formatDateTime, formatTime } from '../utils/formatDate';
import { renderMessageWithMentions } from '../utils/mentions';
import QuoteBlock from './QuoteBlock';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_SEEN_AVATARS   = 4;

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

function SeenBy({ seenBy }) {
  if (!seenBy?.length) return null;
  const visible = seenBy.slice(0, MAX_SEEN_AVATARS);
  const extra   = seenBy.length - visible.length;
  const title   = `Visto por: ${seenBy.map((s) => s.username).join(', ')}`;
  return (
    <div className="message-seen-by" title={title}>
      {visible.map((v) => (
        <span key={v.userId} className="seen-mini-avatar">{v.username.charAt(0).toUpperCase()}</span>
      ))}
      {extra > 0 && <span className="seen-extra-count">+{extra}</span>}
    </div>
  );
}

function ImageLightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="lightbox-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <img
        src={src}
        alt="Imagen ampliada"
        className="lightbox-image"
        onClick={(e) => e.stopPropagation()}
      />
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Cerrar">
        <i className="bi bi-x-lg" />
      </button>
    </div>
  );
}

export default function MessageItem({
  message,
  isOwner,
  onEdit,
  onQuote,
  currentUsername,
  onMarkSeen,
}) {
  const [isEditing,    setIsEditing]    = useState(false);
  const [editContent,  setEditContent]  = useState(message.content);
  const [error,        setError]        = useState('');
  const [isSaving,     setIsSaving]     = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const articleRef = useRef(null);

  // Mark as seen when the message enters the viewport (only for others' messages)
  useEffect(() => {
    if (isOwner || !onMarkSeen) return;
    const el = articleRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { onMarkSeen(message.id); observer.disconnect(); } },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setError('');
    const trimmed = editContent.trim();
    if (!trimmed)                         { setError('El mensaje no puede estar vacío.'); return; }
    if (trimmed.length > MAX_MESSAGE_LENGTH) { setError(`El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`); return; }
    setIsSaving(true);
    const result = await onEdit(message.id, trimmed);
    setIsSaving(false);
    if (result?.success) setIsEditing(false);
    else setError(result?.error ?? 'No se pudo editar el mensaje.');
  };

  const handleCancel = () => { setEditContent(message.content); setError(''); setIsEditing(false); };

  const seenCount = message.seenBy?.length ?? 0;

  return (
    <>
      <article
        ref={articleRef}
        className={`message-item animate-slide-in ${isOwner ? 'is-own' : 'is-other'}`}
      >
        {!isOwner && (
          <div className="message-avatar">{message.username.charAt(0).toUpperCase()}</div>
        )}

        <div className="message-bubble-wrap">
          <div className={`message-bubble ${isOwner ? 'own' : 'other'}`}>
            {!isOwner && <strong className="message-username">{message.username}</strong>}

            {message.replyTo && (
              <QuoteBlock replyTo={message.replyTo} currentUsername={currentUsername} compact />
            )}

            {/* Image attachment */}
            {message.imageUrl && (
              <div className={`message-image-wrap ${!message.content ? 'image-only' : ''}`}>
                <img
                  src={message.imageUrl}
                  alt={`Imagen de ${message.username}`}
                  className="message-image"
                  onClick={() => setLightboxOpen(true)}
                  loading="lazy"
                />
              </div>
            )}

            {isEditing ? (
              <div className="message-edit-form">
                <textarea
                  className={`form-control ${error ? 'is-invalid' : ''}`}
                  rows={3}
                  value={editContent}
                  onChange={(e) => { setEditContent(e.target.value); if (error) setError(''); }}
                  maxLength={MAX_MESSAGE_LENGTH}
                  disabled={isSaving}
                />
                {error && <div className="invalid-feedback d-block">{error}</div>}
                <div className="message-edit-actions">
                  <button type="button" className="btn btn-sm btn-primary" onClick={handleSave} disabled={isSaving}>Guardar</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCancel} disabled={isSaving}>Cancelar</button>
                </div>
              </div>
            ) : (
              message.content && <MessageContent content={message.content} currentUsername={currentUsername} />
            )}

            <footer className="message-footer">
              <time className="message-time" dateTime={message.createdAt} title={formatDateTime(message.createdAt)}>
                {formatTime(message.createdAt)}
              </time>
              {message.isEdited && (
                <span className="message-edited-label"> · editado {formatTime(message.updatedAt)}</span>
              )}
              {isOwner && (
                <i
                  className={`bi message-check ${seenCount > 0 ? 'bi-check2-all is-seen' : 'bi-check2'}`}
                  title={seenCount > 0 ? `Visto por ${seenCount} persona${seenCount > 1 ? 's' : ''}` : 'Enviado'}
                />
              )}
            </footer>
          </div>

          {isOwner && <SeenBy seenBy={message.seenBy} />}

          {!isEditing && (
            <div className="message-actions">
              <button type="button" className="btn btn-sm btn-link message-action-btn" onClick={() => onQuote(message)} title="Citar mensaje">
                <i className="bi bi-reply-fill" />
              </button>
              {isOwner && (
                <button type="button" className="btn btn-sm btn-link message-action-btn" onClick={() => setIsEditing(true)} title="Editar mensaje">
                  <i className="bi bi-pencil" />
                </button>
              )}
            </div>
          )}
        </div>
      </article>

      {lightboxOpen && <ImageLightbox src={message.imageUrl} onClose={() => setLightboxOpen(false)} />}
    </>
  );
}
