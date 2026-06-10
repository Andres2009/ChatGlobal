import { randomUUID } from 'crypto';
import { ROOMS, getRoomById } from '../config/rooms.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { ConnectedUser } from '../models/ConnectedUser.js';

const MAX_ALIAS_LENGTH = 30;
const MAX_MESSAGE_LENGTH = 2000;
const MENTION_REGEX = /@([\p{L}\p{N}_-]+)/gu;

class RoomState {
  constructor(config) {
    this.config = config;
    this.users = new Map();
    this.messages = [];
  }
}

export class MemoryStore {
  constructor() {
    this.rooms = new Map();
    this.socketToSession = new Map();

    for (const room of ROOMS) {
      this.rooms.set(room.id, new RoomState(room));
    }
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

  getRoomsList() {
    return ROOMS.map((room) => ({
      ...room,
      userCount: this.rooms.get(room.id)?.users.size ?? 0,
    }));
  }

  getRoomState(roomId) {
    return this.rooms.get(roomId) ?? null;
  }

  isUsernameTaken(roomId, username, excludeUserId = null) {
    const room = this.getRoomState(roomId);
    if (!room) return false;

    for (const user of room.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase() && user.id !== excludeUserId) {
        return true;
      }
    }
    return false;
  }

  extractMentions(content, roomId) {
    const room = this.getRoomState(roomId);
    if (!room) return [];

    const mentions = [];
    const seen = new Set();
    const matches = content.matchAll(MENTION_REGEX);

    for (const match of matches) {
      const mentionName = match[1];
      const user = Array.from(room.users.values()).find(
        (item) => item.username.toLowerCase() === mentionName.toLowerCase()
      );

      if (user && !seen.has(user.id)) {
        seen.add(user.id);
        mentions.push({ id: user.id, username: user.username });
      }
    }

    return mentions;
  }

  addUser(socketId, username, roomId) {
    const roomConfig = getRoomById(roomId);
    if (!roomConfig) {
      return { success: false, error: 'La sala seleccionada no existe.' };
    }

    const validation = MemoryStore.validateAlias(username);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    if (this.isUsernameTaken(roomId, validation.value)) {
      return { success: false, error: 'Ese alias ya está en uso en esta sala. Elige otro.' };
    }

    const room = this.getRoomState(roomId);
    const user = new ConnectedUser({
      id: randomUUID(),
      socketId,
      username: validation.value,
      roomId,
    });

    room.users.set(user.id, user);
    this.socketToSession.set(socketId, { userId: user.id, roomId });

    return { success: true, user, room: roomConfig };
  }

  removeUserBySocketId(socketId) {
    const session = this.socketToSession.get(socketId);
    if (!session) return null;

    const room = this.getRoomState(session.roomId);
    const user = room?.users.get(session.userId) ?? null;

    if (user) {
      room.users.delete(user.id);
    }

    this.socketToSession.delete(socketId);
    return user;
  }

  getUserBySocketId(socketId) {
    const session = this.socketToSession.get(socketId);
    if (!session) return null;

    const room = this.getRoomState(session.roomId);
    return room?.users.get(session.userId) ?? null;
  }

  getUsersList(roomId) {
    const room = this.getRoomState(roomId);
    if (!room) return [];

    return Array.from(room.users.values())
      .map((user) => user.toJSON())
      .sort((a, b) => a.username.localeCompare(b.username, 'es'));
  }

  buildReplySnapshot(room, replyToMessageId) {
    if (!replyToMessageId) return null;

    const original = room.messages.find((item) => item.id === replyToMessageId);
    if (!original || original.type !== 'user') return null;

    const preview =
      original.content.length > 140 ? `${original.content.slice(0, 140)}…` : original.content;

    return {
      id: original.id,
      username: original.username,
      content: preview,
    };
  }

  addMessage({ roomId, userId, username, content, type = 'user', replyToMessageId = null }) {
    const validation = MemoryStore.validateMessage(content);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const room = this.getRoomState(roomId);
    if (!room) {
      return { success: false, error: 'Sala no encontrada.' };
    }

    const mentions = this.extractMentions(validation.value, roomId);
    const replyTo = this.buildReplySnapshot(room, replyToMessageId);
    const message = new ChatMessage({
      userId,
      username,
      content: validation.value,
      type,
      mentions,
      replyTo,
    });

    room.messages.push(message);
    return { success: true, message };
  }

  addSystemMessage(roomId, content) {
    const room = this.getRoomState(roomId);
    if (!room) return null;

    const message = new ChatMessage({
      username: 'Sistema',
      content: MemoryStore.sanitizeText(content),
      type: 'system',
    });

    room.messages.push(message);
    return message;
  }

  editMessage(roomId, messageId, userId, newContent) {
    const validation = MemoryStore.validateMessage(newContent);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const room = this.getRoomState(roomId);
    if (!room) {
      return { success: false, error: 'Sala no encontrada.' };
    }

    const message = room.messages.find((item) => item.id === messageId);
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
    message.mentions = this.extractMentions(validation.value, roomId);

    return { success: true, message };
  }

  getHistory(roomId) {
    const room = this.getRoomState(roomId);
    if (!room) return [];
    return room.messages.map((message) => message.toJSON());
  }
}

export const memoryStore = new MemoryStore();
