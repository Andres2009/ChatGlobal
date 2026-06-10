import { randomUUID } from 'crypto';
import { ChatMessage } from '../models/ChatMessage.js';
import { ConnectedUser } from '../models/ConnectedUser.js';

const MAX_ALIAS_LENGTH = 30;
const MAX_MESSAGE_LENGTH = 2000;

export class MemoryStore {
  constructor() {
    this.users = new Map();
    this.messages = [];
    this.socketToUserId = new Map();
  }

  static sanitizeText(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/<[^>]*>/g, '').trim();
  }

  static validateAlias(alias) {
    const sanitized = MemoryStore.sanitizeText(alias);
    if (!sanitized) {
      return { valid: false, error: 'El alias no puede estar vacío.' };
    }
    if (sanitized.length > MAX_ALIAS_LENGTH) {
      return { valid: false, error: `El alias no puede superar ${MAX_ALIAS_LENGTH} caracteres.` };
    }
    return { valid: true, value: sanitized };
  }

  static validateMessage(content) {
    const sanitized = MemoryStore.sanitizeText(content);
    if (!sanitized) {
      return { valid: false, error: 'El mensaje no puede estar vacío.' };
    }
    if (sanitized.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.` };
    }
    return { valid: true, value: sanitized };
  }

  isUsernameTaken(username, excludeUserId = null) {
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase() && user.id !== excludeUserId) {
        return true;
      }
    }
    return false;
  }

  addUser(socketId, username) {
    const validation = MemoryStore.validateAlias(username);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    if (this.isUsernameTaken(validation.value)) {
      return { success: false, error: 'Ese alias ya está en uso. Elige otro.' };
    }

    const user = new ConnectedUser({
      id: randomUUID(),
      socketId,
      username: validation.value,
    });

    this.users.set(user.id, user);
    this.socketToUserId.set(socketId, user.id);

    return { success: true, user };
  }

  removeUserBySocketId(socketId) {
    const userId = this.socketToUserId.get(socketId);
    if (!userId) return null;

    const user = this.users.get(userId);
    this.users.delete(userId);
    this.socketToUserId.delete(socketId);

    return user ?? null;
  }

  getUserBySocketId(socketId) {
    const userId = this.socketToUserId.get(socketId);
    if (!userId) return null;
    return this.users.get(userId) ?? null;
  }

  getUsersList() {
    return Array.from(this.users.values())
      .map((user) => user.toJSON())
      .sort((a, b) => a.username.localeCompare(b.username, 'es'));
  }

  addMessage({ userId, username, content, type = 'user' }) {
    const validation = MemoryStore.validateMessage(content);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const message = new ChatMessage({
      userId,
      username,
      content: validation.value,
      type,
    });

    this.messages.push(message);
    return { success: true, message };
  }

  addSystemMessage(content) {
    const message = new ChatMessage({
      username: 'Sistema',
      content: MemoryStore.sanitizeText(content),
      type: 'system',
    });

    this.messages.push(message);
    return message;
  }

  editMessage(messageId, userId, newContent) {
    const validation = MemoryStore.validateMessage(newContent);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const message = this.messages.find((item) => item.id === messageId);
    if (!message) {
      return { success: false, error: 'Mensaje no encontrado.' };
    }

    if (message.type !== 'user') {
      return { success: false, error: 'Este mensaje no se puede editar.' };
    }

    if (message.userId !== userId) {
      return { success: false, error: 'Solo puedes editar tus propios mensajes.' };
    }

    message.content = validation.value;
    message.updatedAt = new Date().toISOString();
    message.isEdited = true;

    return { success: true, message };
  }

  getHistory() {
    return this.messages.map((message) => message.toJSON());
  }
}

export const memoryStore = new MemoryStore();
