import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DATA_DIR   = path.join(__dirname, '../data');
const DATA_PATH  = path.join(DATA_DIR, 'chat-history.json');
const MAX_PER_ROOM = 1000;
const SAVE_DEBOUNCE_MS = 1500;

class HistoryService {
  constructor() {
    this._data      = {};
    this._saveTimer = null;
  }

  async load() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const raw    = await fs.readFile(DATA_PATH, 'utf-8');
      const parsed = JSON.parse(raw);

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        this._data = parsed;
        const total = Object.values(this._data).reduce((s, arr) => s + arr.length, 0);
        console.log(`[HistoryService] Cargado: ${Object.keys(this._data).length} salas, ${total} mensajes`);
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        this._data = {};
        await this._flush();
        console.log('[HistoryService] Archivo creado en', DATA_PATH);
      } else if (err instanceof SyntaxError) {
        console.error('[HistoryService] JSON corrupto — reiniciando historial.');
        this._data = {};
        await this._flush();
      } else {
        console.error('[HistoryService] Error al cargar:', err.message);
        this._data = {};
      }
    }
  }

  getHistory(roomId) {
    return this._data[roomId] ?? [];
  }

  addMessage(roomId, messageJson) {
    if (!this._data[roomId]) this._data[roomId] = [];
    this._data[roomId].push(messageJson);

    if (this._data[roomId].length > MAX_PER_ROOM) {
      this._data[roomId] = this._data[roomId].slice(-MAX_PER_ROOM);
    }

    this._scheduleSave();
  }

  updateMessage(roomId, messageId, updatedJson) {
    const arr = this._data[roomId];
    if (!arr) return;
    const idx = arr.findIndex((m) => m.id === messageId);
    if (idx !== -1) {
      arr[idx] = updatedJson;
      this._scheduleSave();
    }
  }

  _scheduleSave() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(async () => {
      this._saveTimer = null;
      await this._flush();
    }, SAVE_DEBOUNCE_MS);
  }

  async _flush() {
    const tmp = DATA_PATH + '.tmp';
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(tmp, JSON.stringify(this._data, null, 2), 'utf-8');
      await fs.rename(tmp, DATA_PATH);
    } catch (err) {
      console.error('[HistoryService] Error al guardar:', err.message);
    }
  }
}

export const historyService = new HistoryService();
