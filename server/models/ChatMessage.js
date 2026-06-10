import { randomUUID } from 'crypto';

export class ChatMessage {
  constructor({
    id,
    userId,
    username,
    content,
    createdAt,
    updatedAt,
    isEdited = false,
    type = 'user',
    mentions = [],
    replyTo = null,
  }) {
    this.id = id ?? randomUUID();
    this.userId = userId ?? null;
    this.username = username;
    this.content = content;
    this.createdAt = createdAt ?? new Date().toISOString();
    this.updatedAt = updatedAt ?? this.createdAt;
    this.isEdited = isEdited;
    this.type = type;
    this.mentions = mentions;
    this.replyTo = replyTo;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      username: this.username,
      content: this.content,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isEdited: this.isEdited,
      type: this.type,
      mentions: this.mentions,
      replyTo: this.replyTo,
    };
  }
}
