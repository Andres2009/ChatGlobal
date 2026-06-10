import { useState } from 'react';

const MAX_MESSAGE_LENGTH = 2000;

export default function MessageInput({ onSend, disabled }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setError('');
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Escribe un mensaje antes de enviar.');
      return;
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(`El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`);
      return;
    }

    setIsSending(true);
    const result = await onSend(trimmed);
    setIsSending(false);

    if (result?.success) {
      setContent('');
    } else {
      setError(result?.error ?? 'No se pudo enviar el mensaje.');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && !isSending) {
        handleSend();
      }
    }
  };

  return (
    <footer className="message-input-area">
      {error && (
        <div className="alert alert-danger py-2 px-3 mb-2 animate-fade-in" role="alert">
          {error}
        </div>
      )}
      <div className="message-input-wrapper">
        <textarea
          className="form-control message-textarea"
          placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
          rows={2}
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            if (error) setError('');
          }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={disabled || isSending}
        />
        <button
          type="button"
          className="btn btn-primary send-btn"
          onClick={handleSend}
          disabled={disabled || isSending || !content.trim()}
          title="Enviar mensaje"
        >
          {isSending ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
          ) : (
            <i className="bi bi-send-fill" />
          )}
        </button>
      </div>
      <div className="form-text text-end">{content.trim().length}/{MAX_MESSAGE_LENGTH}</div>
    </footer>
  );
}
