import { useEffect, useRef, useState } from 'react';
import GifPicker from './GifPicker';
import MentionSuggestions from './MentionSuggestions';
import QuoteBlock from './QuoteBlock';
import {
  filterUsersForMention,
  getMentionQuery,
  insertMention,
} from '../utils/mentions';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_IMAGE_SIZE     = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export default function MessageInput({
  onSend,
  disabled,
  users,
  currentUserId,
  quotedMessage,
  onClearQuote,
  onTypingStart,
  onTypingStop,
}) {
  const [content,         setContent]         = useState('');
  const [error,           setError]           = useState('');
  const [isSending,       setIsSending]       = useState(false);
  const [isUploading,     setIsUploading]     = useState(false);
  const [mentionState,    setMentionState]    = useState(null);
  const [activeSuggestion,setActiveSuggestion]= useState(0);
  const [imageFile,       setImageFile]       = useState(null);   // File (upload)
  const [imagePreview,    setImagePreview]    = useState(null);   // blob URL or external GIF URL
  const [pendingGifUrl,   setPendingGifUrl]   = useState(null);   // external GIF URL (no upload)
  const [showGifPicker,   setShowGifPicker]   = useState(false);

  const textareaRef   = useRef(null);
  const fileInputRef  = useRef(null);
  const isTypingRef   = useRef(false);
  const typingTimerRef= useRef(null);

  const suggestions =
    mentionState && users
      ? filterUsersForMention(users, mentionState.query, currentUserId)
      : [];

  useEffect(() => {
    if (quotedMessage) textareaRef.current?.focus();
  }, [quotedMessage]);

  // Revoke object URL when component unmounts or image changes
  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const focusInput = () => {
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const updateMentionState = (value, cursorPosition) => {
    setMentionState(getMentionQuery(value, cursorPosition));
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

  // ── Typing indicator ─────────────────────────────────────────────────────
  const notifyTypingStart = () => {
    if (!isTypingRef.current) {
      onTypingStart?.();
      isTypingRef.current = true;
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onTypingStop?.();
      isTypingRef.current = false;
    }, 2500);
  };

  const notifyTypingStop = () => {
    clearTimeout(typingTimerRef.current);
    if (isTypingRef.current) {
      onTypingStop?.();
      isTypingRef.current = false;
    }
  };

  // Stop typing when unmounting
  useEffect(() => () => notifyTypingStop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Paste image from clipboard ────────────────────────────────────────────
  const handlePaste = (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        if (file.size > MAX_IMAGE_SIZE) { setError('La imagen no puede superar 5 MB.'); return; }
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setError('');
        return; // only first image
      }
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    event.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError('Solo se permiten imágenes (JPG, PNG, GIF, WEBP).');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('La imagen no puede superar 5 MB.');
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
    focusInput();
  };

  const clearImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setPendingGifUrl(null);
  };

  const handleGifSelect = (gifUrl) => {
    clearImage();
    setShowGifPicker(false);
    setPendingGifUrl(gifUrl);
    setImagePreview(gifUrl);
    setError('');
    focusInput();
  };

  const handleSend = async () => {
    setError('');
    const trimmed = content.trim();

    if (!trimmed && !imageFile) {
      setError('Escribe un mensaje o adjunta una imagen.');
      focusInput();
      return;
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(`El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`);
      focusInput();
      return;
    }

    // Resolve imageUrl: external GIF (no upload) or uploaded file
    let imageUrl = pendingGifUrl ?? null;
    if (!imageUrl && imageFile) {
      setIsUploading(true);
      try {
        const form = new FormData();
        form.append('image', imageFile);
        const res = await fetch('/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'No se pudo subir la imagen.');
          setIsUploading(false);
          focusInput();
          return;
        }
        imageUrl = data.url;
      } catch {
        setError('Error al subir la imagen. Intenta de nuevo.');
        setIsUploading(false);
        focusInput();
        return;
      }
      setIsUploading(false);
    }

    notifyTypingStop();
    setIsSending(true);
    const result = await onSend(trimmed, quotedMessage?.id ?? null, imageUrl);
    setIsSending(false);

    if (result?.success) {
      setContent('');
      setMentionState(null);
      clearImage();
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
        setActiveSuggestion((i) => (i + 1) % suggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveSuggestion((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        handleSelectMention(suggestions[activeSuggestion]);
        return;
      }
      if (event.key === 'Escape') { setMentionState(null); return; }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && !isSending && !isUploading) handleSend();
    }
  };

  const busy = isSending || isUploading;
  const canSend = !busy && !disabled && (content.trim().length > 0 || !!imageFile);

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
              replyTo={{ id: quotedMessage.id, username: quotedMessage.username, content: quotedMessage.content }}
              compact
            />
          </div>
          <button type="button" className="btn btn-sm btn-link quote-input-clear" onClick={onClearQuote} aria-label="Cancelar cita">
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="image-attach-preview">
          <img src={imagePreview} alt="Vista previa" className="image-attach-thumb" />
          <button type="button" className="btn btn-sm btn-link image-attach-clear" onClick={clearImage} aria-label="Quitar imagen">
            <i className="bi bi-x-circle-fill" />
          </button>
          {isUploading && (
            <div className="image-attach-uploading">
              <span className="spinner-border spinner-border-sm me-1" />
              Subiendo…
            </div>
          )}
        </div>
      )}

      <div className="message-input-wrapper position-relative">
        {showGifPicker && (
          <GifPicker
            onSelect={handleGifSelect}
            onClose={() => { setShowGifPicker(false); focusInput(); }}
          />
        )}

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
          placeholder="Escribe un mensaje… @ para mencionar"
          rows={2}
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            updateMentionState(event.target.value, event.target.selectionStart);
            if (error) setError('');
            if (event.target.value.trim()) notifyTypingStart();
            else notifyTypingStop();
          }}
          onClick={(event) => updateMentionState(content, event.target.selectionStart)}
          onKeyUp={(event) => updateMentionState(event.target.value, event.target.selectionStart)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={disabled}
          autoFocus
        />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="d-none"
          onChange={handleImageSelect}
          disabled={disabled || busy}
        />

        <button
          type="button"
          className={`btn image-attach-btn ${imageFile ? 'has-image' : ''}`}
          onClick={() => { setShowGifPicker(false); fileInputRef.current?.click(); }}
          disabled={disabled || busy}
          title="Adjuntar imagen"
          aria-label="Adjuntar imagen"
        >
          <i className="bi bi-image" />
        </button>

        <button
          type="button"
          className={`btn gif-attach-btn ${showGifPicker ? 'active' : ''}`}
          onClick={() => setShowGifPicker((v) => !v)}
          disabled={disabled || busy}
          title="Buscar GIF"
          aria-label="Buscar GIF"
        >
          GIF
        </button>

        <button
          type="button"
          className="btn btn-primary send-btn"
          onClick={handleSend}
          disabled={!canSend}
          title="Enviar mensaje"
        >
          {busy ? (
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
