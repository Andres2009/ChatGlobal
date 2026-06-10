export class ConnectedUser {
  constructor({ id, socketId, username, roomId, joinedAt }) {
    this.id = id;
    this.socketId = socketId;
    this.username = username;
    this.roomId = roomId;
    this.joinedAt = joinedAt ?? new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      socketId: this.socketId,
      username: this.username,
      roomId: this.roomId,
      joinedAt: this.joinedAt,
    };
  }
}
