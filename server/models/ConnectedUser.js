export class ConnectedUser {
  constructor({ id, socketId, username, joinedAt }) {
    this.id = id;
    this.socketId = socketId;
    this.username = username;
    this.joinedAt = joinedAt ?? new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      socketId: this.socketId,
      username: this.username,
      joinedAt: this.joinedAt,
    };
  }
}
