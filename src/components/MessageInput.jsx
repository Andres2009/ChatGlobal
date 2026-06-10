import { useEffect, useRef, useState } from 'react';
import MentionSuggestions from './MentionSuggestions';
import QuoteBlock from './QuoteBlock';
import {
  filterUsersForMention,
  getMentionQuery,
  insertMention,
} from '../utils/mentions';

const MAX_MESSAGE_LENGTH = 2000;

export default function MessageInput({
  onSend,
  disabled,
  users,
  currentUserId,
  quotedMessage,
  onClearQuote,
}) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [mentionState, setMentionState] = useState(null);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const textareaRef = useRef(null);

  const suggestions =
    mentionState && users
      ? filterUsersForMention(users, mentionState.query, currentUserId)
      : [];

  useEffect(() => {
    if (quotedMessage) {
      textareaRef.current?.focus();
    }
  }, [quotedMessage]);

  const focusInput = () => {
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const updateMentionState = (value, cursorPosition) => {
    const mentionQuery = getMentionQuery(value, cursorPosition);
    setMentionState(mentionQuery);
    setActiveSuggestion(0);
  };

  const handleSelectMention = (user) => {
    if (!mentionState) return;

    const newContent = insertMention(content, mentionState.start, user.username);
    setContent(newContent);
    setMentionState(null);
    setActiveSuggestion(0);

    requestAnimationFrame(() => {
      const position = mentionState.start + user.username.length + 2;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(position, position);
    });
  };

  const handleSend = async () => {
    setError('');
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Escribe un mensaje antes de enviar.');
      focusInput();
      return;
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(`El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`);
      focusInput();
      return;
    }

    setIsSending(true);
    const result = await onSend(trimmed, quotedMessage?.id ?? null);
    setIsSending(false);

    if (result?.success) {
      setContent('');
      setMentionState(null);
      onClearQuote?.();
      focusInput();
    } else {
      setError(result?.error ?? 'No se pudo enviar el mensaje.');
      focusInput();
    }
  };

  const handleKeyDown = (event) => {
    if (mentionState && suggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveSuggestion((index) => (index + 1) % suggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveSuggestion((index) => (index - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        handleSelectMention(suggestions[activeSuggestion]);
        return;
      }
      if (event.key === 'Escape') {
        setMentionState(null);
        return;
      }
    }

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

      {quotedMessage && (
        <div className="quote-input-preview">
          <div className="quote-input-preview-body">
            <small className="text-muted d-block mb-1">Respondiendo a @{quotedMessage.username}</small>
            <QuoteBlock
              replyTo={{
                id: quotedMessage.id,
                username: quotedMessage.username,
                content: quotedMessage.content,
              }}
              compact
            />
          </div>
          <button
            type="button"
            className="btn btn-sm btn-link quote-input-clear"
            onClick={onClearQuote}
            aria-label="Cancelar cita"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      <div className="message-input-wrapper position-relative">
        {mentionState && (
          <MentionSuggestions
            suggestions={suggestions}
            activeIndex={activeSuggestion}
            onSelect={handleSelectMention}
          />
        )}
        <textarea
          ref={textareaRef}
          className="form-control message-textarea"
          placeholder="Escribe un mensaje... @ para mencionar"
          rows={2}
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            updateMentionState(event.target.value, event.target.selectionStart);
            if (error) setError('');
          }}
          onClick={(event) => updateMentionState(content, event.target.selectionStart)}
          onKeyUp={(event) => updateMentionState(event.target.value, event.target.selectionStart)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={disabled}
          autoFocus
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
