import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocketIO(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    // Client joins room based on role or user ID
    socket.on('join_role', (role: string) => {
      socket.join(`role_${role}`);
    });

    socket.on('join_user', (userId: string) => {
      socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  console.log('[Socket.IO] Real-time notification gateway initialized.');
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function broadcastNotification(notif: any) {
  if (!io) return;

  // Emit to specific user if applicable
  if (notif.recipientId) {
    io.to(`user_${notif.recipientId}`).emit('new_notification', notif);
  }

  // Emit to role room (e.g. role_admin)
  if (notif.recipientRole) {
    io.to(`role_${notif.recipientRole}`).emit('new_notification', notif);
  }

  // Emit globally as fallback
  io.emit('notification_event', notif);
}
