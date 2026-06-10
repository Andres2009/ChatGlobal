import { memoryStore } from '../services/MemoryStore.js';

const ROOM_ID = 'global-chat';

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('join-chat', (payload, callback) => {
      const username = payload?.username ?? '';
      const result = memoryStore.addUser(socket.id, username);

      if (!result.success) {
        if (typeof callback === 'function') {
          callback({ success: false, error: result.error });
        }
        return;
      }

      const { user } = result;
      socket.join(ROOM_ID);

      const systemMessage = memoryStore.addSystemMessage(`${user.username} ingresó a la sala`);
      const users = memoryStore.getUsersList();
      const history = memoryStore.getHistory();

      socket.emit('history-loaded', { messages: history, users, currentUser: user.toJSON() });

      socket.to(ROOM_ID).emit('user-joined', {
        user: user.toJSON(),
        systemMessage: systemMessage.toJSON(),
      });

      io.to(ROOM_ID).emit('users-updated', { users });

      if (typeof callback === 'function') {
        callback({ success: true, user: user.toJSON() });
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
        userId: user.id,
        username: user.username,
        content: payload?.content ?? '',
      });

      if (!result.success) {
        if (typeof callback === 'function') {
          callback({ success: false, error: result.error });
        }
        return;
      }

      io.to(ROOM_ID).emit('receive-message', { message: result.message.toJSON() });

      if (typeof callback === 'function') {
        callback({ success: true, message: result.message.toJSON() });
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

      io.to(ROOM_ID).emit('message-edited', { message: result.message.toJSON() });

      if (typeof callback === 'function') {
        callback({ success: true, message: result.message.toJSON() });
      }
    });

    socket.on('disconnect', () => {
      const user = memoryStore.removeUserBySocketId(socket.id);
      if (!user) return;

      const systemMessage = memoryStore.addSystemMessage(`${user.username} abandonó la sala`);
      const users = memoryStore.getUsersList();

      io.to(ROOM_ID).emit('user-left', {
        user: user.toJSON(),
        systemMessage: systemMessage.toJSON(),
      });

      io.to(ROOM_ID).emit('users-updated', { users });
    });
  });
}
