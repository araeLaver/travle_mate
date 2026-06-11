import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const setupWebSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ALLOWED_ORIGINS || '*',
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware for WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return next(new Error('Authentication error'));
      (socket as any).user = user;
      next();
    });
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`User connected: ${user.nickname} (${user.id})`);

    socket.on('join_room', (roomId) => {
      socket.join(`room_${roomId}`);
      console.log(`User ${user.id} joined room ${roomId}`);
    });

    socket.on('send_message', (data) => {
      const { roomId, message } = data;
      // In a real app, save to DB here
      io.to(`room_${roomId}`).emit('new_message', {
        senderId: user.id,
        senderNickname: user.nickname,
        message,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.id}`);
    });
  });

  return io;
};
