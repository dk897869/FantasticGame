import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initGameEngine } from './services/gameEngine.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend Vite dev server and mobile web
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Attach Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  // Client connected
  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 5000;
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI || MONGODB_URI.includes('<db_username>') || MONGODB_URI.includes('<db_password>') || MONGODB_URI.includes('<username>')) {
  MONGODB_URI = 'mongodb+srv://dskv658_db_user:XQzlcGqz4rWF1jQp@cluster0.u56vcyx.mongodb.net/fantasticgame?retryWrites=true&w=majority&appName=Cluster0';
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB Atlas');
    initGameEngine(io);
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Atlas connection error:', err.message);
    // Even if Atlas has IP restriction delay, launch server so endpoints are testable
    initGameEngine(io);
    server.listen(PORT, () => {
      console.log(`⚠️ Server running on port ${PORT} with offline/reconnecting database state`);
    });
  });
