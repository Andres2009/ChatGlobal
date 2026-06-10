import { useEffect, useRef, useState } from 'react';
import {
  STICKER_PACKS,
  addCustomSticker,
  getCustomStickers,
  removeCustomSticker,
} from '../data/stickerPacks';

const MAX_STICKER_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_STICKER_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const CUSTOM_PACK_ID = '__custom__';

export default function StickerPicker({ onSelect, onClose }) {
  const [activePackId,   setActivePackId]   = useState(STICKER_PACKS[0].id);
  const [customStickers, setCustomStickers] = useState(() => getCustomStickers());
  const [uploading,      setUploading]      = useState(false);
  const [uploadError,    setUploadError]    = useState('');
  const fileInputRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleStickerClick = (emoji) => {
    onSelect({ emoji, imageUrl: null });
  };

  const handleCustomClick = (url) => {
    onSelect({ emoji: null, imageUrl: url });
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_STICKER_TYPES.has(file.type)) {
      setUploadError('Solo se permiten imágenes (JPG, PNG, GIF, WEBP).');
      return;
    }
    if (file.size > MAX_STICKER_SIZE) {
      setUploadError('El sticker no puede superar 5 MB.');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const res  = await fetch('/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? 'No se pudo subir el sticker.');
        return;
      }
      addCustomSticker(data.url);
      setCustomStickers(getCustomStickers());
    } catch {
      setUploadError('Error al subir. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCustom = (e, id) => {
    e.stopPropagation();
    removeCustomSticker(id);
    setCustomStickers(getCustomStickers());
  };

  const isCustomTab = activePackId === CUSTOM_PACK_ID;
  const activePack  = STICKER_PACKS.find((p) => p.id === activePackId);

  return (
    <div className="sticker-picker animate-fade-in">
      {/* ── Tab bar ── */}
      <div className="sticker-tabs" role="tablist">
        {STICKER_PACKS.map((pack) => (
          <button
            key={pack.id}
            type="button"
            role="tab"
            aria-selected={activePackId === pack.id}
            className={`sticker-tab ${activePackId === pack.id ? 'active' : ''}`}
            onClick={() => setActivePackId(pack.id)}
            title={pack.name}
          >
            <span className="sticker-tab-icon">{pack.icon}</span>
          </button>
        ))}
        {/* Custom stickers tab */}
        <button
          type="button"
          role="tab"
          aria-selected={isCustomTab}
          className={`sticker-tab sticker-tab-custom ${isCustomTab ? 'active' : ''}`}
          onClick={() => setActivePackId(CUSTOM_PACK_ID)}
          title="Mis stickers"
        >
          <i className="bi bi-person-heart" />
        </button>
      </div>

      {/* ── Pack label ── */}
      <div className="sticker-pack-header">
        <span className="sticker-pack-name">
          {isCustomTab ? 'Mis stickers' : activePack?.name}
        </span>
        <button type="button" className="btn btn-sm btn-link sticker-close-btn" onClick={onClose} aria-label="Cerrar">
          <i className="bi bi-x-lg" />
        </button>
      </div>

      {/* ── Sticker grid ── */}
      <div className="sticker-grid-container">
        {!isCustomTab && (
          <div className="sticker-grid">
            {activePack?.stickers.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                className="sticker-item"
                onClick={() => handleStickerClick(sticker.emoji)}
                title={sticker.label}
              >
                <span className="sticker-emoji">{sticker.emoji}</span>
                <span className="sticker-label">{sticker.label}</span>
              </button>
            ))}
          </div>
        )}

        {isCustomTab && (
          <div className="sticker-custom-section">
            {/* Upload button */}
            <button
              type="button"
              className="sticker-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Subir nuevo sticker"
            >
              {uploading
                ? <span className="spinner-border spinner-border-sm" />
                : <><i className="bi bi-plus-lg" /><span>Agregar sticker</span></>
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="d-none"
              onChange={handleUpload}
            />

            {uploadError && (
              <p className="sticker-upload-error animate-fade-in">{uploadError}</p>
            )}

            {customStickers.length === 0 && !uploading && (
              <div className="sticker-empty">
                <i className="bi bi-image-fill sticker-empty-icon" />
                <p>Sube tus propias imágenes<br />y úsalas como stickers</p>
              </div>
            )}

            {customStickers.length > 0 && (
              <div className="sticker-grid sticker-grid-custom">
                {customStickers.map((s) => (
                  <div key={s.id} className="sticker-item sticker-item-custom">
                    <button
                      type="button"
                      className="sticker-custom-img-btn"
                      onClick={() => handleCustomClick(s.url)}
                      title="Enviar sticker"
                    >
                      <img src={s.url} alt="sticker" className="sticker-custom-thumb" />
                    </button>
                    <button
                      type="button"
                      className="sticker-delete-btn"
                      onClick={(e) => handleDeleteCustom(e, s.id)}
                      aria-label="Eliminar sticker"
                      title="Eliminar"
                    >
                      <i className="bi bi-x-circle-fill" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
