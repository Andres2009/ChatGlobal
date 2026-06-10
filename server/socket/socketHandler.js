import { getRoomById } from '../config/rooms.js';
import { memoryStore } from '../services/MemoryStore.js';

function getRoomChannel(roomId) {
  return `room:${roomId}`;
}

function notifyMentionedUsers(io, roomId, message, senderId) {
  for (const mention of message.mentions ?? []) {
    if (mention.id === senderId) continue;

    const users = memoryStore.getUsersList(roomId);
    const mentionedUser = users.find((user) => user.id === mention.id);
    if (!mentionedUser?.socketId) continue;

    io.to(mentionedUser.socketId).emit('mention-notification', {
      message,
      roomId,
      mentionedBy: message.username,
    });
  }
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.emit('rooms-list', { rooms: memoryStore.getRoomsList() });

    socket.on('get-rooms', (callback) => {
      const rooms = memoryStore.getRoomsList();
      if (typeof callback === 'function') {
        callback({ success: true, rooms });
      } else {
        socket.emit('rooms-list', { rooms });
      }
    });

    socket.on('join-chat', (payload, callback) => {
      const username = payload?.username ?? '';
      const roomId = payload?.roomId ?? '';

      const result = memoryStore.addUser(socket.id, username, roomId);

      if (!result.success) {
        if (typeof callback === 'function') {
          callback({ success: false, error: result.error });
        }
        return;
      }

      const { user, room } = result;
      const channel = getRoomChannel(roomId);
      socket.join(channel);

      const systemMessage = memoryStore.addSystemMessage(
        roomId,
        `${user.username} ingresó a la sala`
      );
      const users = memoryStore.getUsersList(roomId);
      const history = memoryStore.getHistory(roomId);

      socket.emit('history-loaded', {
        messages: history,
        users,
        currentUser: user.toJSON(),
        room,
      });

      socket.to(channel).emit('user-joined', {
        user: user.toJSON(),
        systemMessage: systemMessage.toJSON(),
        roomId,
      });

      io.to(channel).emit('users-updated', { users, roomId });
      io.emit('rooms-list', { rooms: memoryStore.getRoomsList() });

      if (typeof callback === 'function') {
        callback({ success: true, user: user.toJSON(), room });
      }
    });

    socket.on('send-message', (payload, callback) => {
      const user = memoryStore.getUserBySocketId(socket.id);
      if (!user) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Debes unirte al chat primero.' });
        }
        return;
      }

      const result = memoryStore.addMessage({
        roomId: user.roomId,
        userId: user.id,
        username: user.username,
        content: payload?.content ?? '',
        replyToMessageId: payload?.replyToMessageId ?? null,
      });

      if (!result.success) {
        if (typeof callback === 'function') {
          callback({ success: false, error: result.error });
        }
        return;
      }

      const channel = getRoomChannel(user.roomId);
      const messageJson = result.message.toJSON();

      io.to(channel).emit('receive-message', { message: messageJson, roomId: user.roomId });
      notifyMentionedUsers(io, user.roomId, messageJson, user.id);

      if (typeof callback === 'function') {
        callback({ success: true, message: messageJson });
      }
    });

    socket.on('edit-message', (payload, callback) => {
      const user = memoryStore.getUserBySocketId(socket.id);
      if (!user) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Debes unirte al chat primero.' });
        }
        return;
      }

      const result = memoryStore.editMessage(
        user.roomId,
        payload?.messageId,
        user.id,
        payload?.content ?? ''
      );

      if (!result.success) {
        if (typeof callback === 'function') {
          callback({ success: false, error: result.error });
        }
        return;
      }

      const channel = getRoomChannel(user.roomId);
      const messageJson = result.message.toJSON();

      io.to(channel).emit('message-edited', { message: messageJson, roomId: user.roomId });
      notifyMentionedUsers(io, user.roomId, messageJson, user.id);

      if (typeof callback === 'function') {
        callback({ success: true, message: messageJson });
      }
    });

    socket.on('disconnect', () => {
      const user = memoryStore.removeUserBySocketId(socket.id);
      if (!user) return;

      const room = getRoomById(user.roomId);
      const channel = getRoomChannel(user.roomId);
      const systemMessage = memoryStore.addSystemMessage(
        user.roomId,
        `${user.username} abandonó la sala`
      );
      const users = memoryStore.getUsersList(user.roomId);

      io.to(channel).emit('user-left', {
        user: user.toJSON(),
        systemMessage: systemMessage.toJSON(),
        roomId: user.roomId,
      });

      io.to(channel).emit('users-updated', { users, roomId: user.roomId });
      io.emit('rooms-list', { rooms: memoryStore.getRoomsList() });
    });
  });
}
