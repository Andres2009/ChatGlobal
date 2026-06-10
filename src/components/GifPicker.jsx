import { useCallback, useEffect, useRef, useState } from 'react';

const TENOR_KEY  = 'LIVDSRZULELA'; // Tenor demo key
const TENOR_BASE = 'https://g.tenor.com/v1';

export default function GifPicker({ onSelect, onClose }) {
  const [query,   setQuery]   = useState('');
  const [gifs,    setGifs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const debounceRef = useRef(null);
  const searchRef   = useRef(null);

  const fetchGifs = useCallback(async (q) => {
    setLoading(true);
    setError('');
    try {
      const endpoint = q
        ? `${TENOR_BASE}/search?key=${TENOR_KEY}&q=${encodeURIComponent(q)}&limit=24&media_filter=minimal&locale=es_ES`
        : `${TENOR_BASE}/trending?key=${TENOR_KEY}&limit=24&media_filter=minimal`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('network');
      const data = await res.json();
      setGifs(data.results ?? []);
    } catch {
      setError('No se pudieron cargar los GIFs. Verifica tu conexión.');
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load trending on mount and focus search input
  useEffect(() => {
    fetchGifs('');
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [fetchGifs]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSearch = (value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGifs(value.trim()), 450);
  };

  const handleSelect = (gif) => {
    const url = gif.media?.[0]?.gif?.url;
    if (url) onSelect(url);
  };

  return (
    <div className="gif-picker animate-fade-in">
      <div className="gif-picker-header">
        <input
          ref={searchRef}
          type="search"
          className="form-control form-control-sm gif-search-input"
          placeholder="Buscar GIFs…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-sm btn-link gif-close-btn"
          onClick={onClose}
          aria-label="Cerrar buscador de GIFs"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <div className="gif-grid-container">
        {loading && (
          <div className="gif-loading">
            <span className="spinner-border spinner-border-sm text-secondary" />
          </div>
        )}
        {!loading && error && (
          <p className="gif-message gif-error">{error}</p>
        )}
        {!loading && !error && gifs.length === 0 && (
          <p className="gif-message">No se encontraron GIFs.</p>
        )}
        {!loading && !error && gifs.length > 0 && (
          <div className="gif-grid">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                className="gif-item"
                onClick={() => handleSelect(gif)}
                title={gif.title || 'GIF'}
              >
                <img
                  src={gif.media?.[0]?.tinygif?.url}
                  alt={gif.title || 'GIF'}
                  loading="lazy"
                  className="gif-thumb"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="gif-footer">
        <span className="gif-footer-text">Powered by Tenor</span>
      </div>
    </div>
  );
}
