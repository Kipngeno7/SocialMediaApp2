import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (userId: string) => {
  socket = io('http://YOUR_SERVER_IP:3000'); // Replace with your backend IP
  socket.on('connect', () => {
    console.log('Connected to WebSocket:', socket?.id);
    socket?.emit('join', userId); // Join user-specific room
  });
};

export const disconnectSocket = () => {
  socket?.disconnect();
};

export const subscribeToNewPosts = (callback: (post: any) => void) => {
  socket?.on('new_post', callback);
};

export const sendNewPost = (post: any) => {
  socket?.emit('new_post', post);
};
