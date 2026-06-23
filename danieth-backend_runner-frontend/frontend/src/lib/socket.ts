import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getDashboardSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
      transports: ['websocket'],
      autoConnect: false,
    });
  }

  return socket;
}