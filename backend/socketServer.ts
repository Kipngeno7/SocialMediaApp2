import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join user-specific room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  // Listen for new posts from clients
  socket.on('new_post', async (post) => {
    console.log('New post received:', post);

    // Save post to Firestore
    const postRef = await db.collection('posts').add(post);
    const savedPost = { id: postRef.id, ...post };

    // Broadcast to all connected clients
    io.emit('new_post', savedPost);

    // Push notification to all users (using Expo push tokens)
    const usersSnapshot = await db.collection('users').get();
    usersSnapshot.forEach(async (userDoc) => {
      const token = userDoc.data().expoPushToken;
      if (token) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: token,
            sound: 'default',
            title: 'New Post!',
            body: post.title || 'A user posted something new!',
            data: { postId: postRef.id },
          }),
        });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Socket.io server running on port 3000');
});
