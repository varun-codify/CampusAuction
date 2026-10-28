import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import auctionRoutes, { setAuctionRoutesSocketIO } from './routes/auctionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { setSocketIO } from './engine/biddingEngine.js';
import { setWorkerSocketIO, startAuctionWorker } from './engine/auctionWorker.js';
import { seedDatabase } from './db/seed.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setSocketIO(io);
setWorkerSocketIO(io);
setAuctionRoutesSocketIO(io);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure uploads folder exists
const uploadsDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Campus Auction API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Real-Time Socket.IO Channels
io.on('connection', (socket) => {
  // Join auction room for real-time bid updates
  socket.on('join:auction', (auctionId: string) => {
    socket.join(`auction:${auctionId}`);
  });

  socket.on('leave:auction', (auctionId: string) => {
    socket.leave(`auction:${auctionId}`);
  });

  // Join user room for targeted notifications
  socket.on('join:user', (userId: string) => {
    socket.join(`user:${userId}`);
  });

  socket.on('leave:user', (userId: string) => {
    socket.leave(`user:${userId}`);
  });

  // Real-time chat messaging
  socket.on('chat:message', (data: { auctionId: string; userId: string; userName: string; message: string }) => {
    // Broadcast message to all participants in the auction room
    io.to(`auction:${data.auctionId}`).emit('chat:message', {
      auctionId: data.auctionId,
      userId: data.userId,
      userName: data.userName,
      message: data.message,
      createdAt: new Date(),
    });
  });
});

// Start Server, Background Worker, and Auto-seed
server.listen(PORT, async () => {
  console.log(`🚀 [Campus Auction Server] Running on http://localhost:${PORT}`);
  try {
    if (process.env.SEED_DATABASE === 'true') {
      await seedDatabase();
    }
    startAuctionWorker(5000);
  } catch (err) {
    console.error('[Startup Error]:', err);
  }
});

export { app, server };
