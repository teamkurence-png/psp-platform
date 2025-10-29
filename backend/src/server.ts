import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { connectDatabase } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notificationService } from './services/notificationService.js';

// Import routes
import authRoutes from './routes/auth.js';
import merchantRoutes from './routes/merchants.js';
import paymentRequestRoutes from './routes/paymentRequests.js';
import pspPaymentRoutes from './routes/pspPayments.js';
import dashboardRoutes from './routes/dashboard.js';
import balanceRoutes from './routes/balances.js';
import withdrawalRoutes from './routes/withdrawals.js';
import customerRoutes from './routes/customers.js';
import settingsRoutes from './routes/settings.js';
import bankAccountRoutes from './routes/bankAccounts.js';
import cardRoutes from './routes/cards.js';
import contactRoutes from './routes/contacts.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4173',
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  path: '/socket.io/',
  connectTimeout: 45000,
  pingTimeout: 30000,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/payment-requests', paymentRequestRoutes);
app.use('/api/psp-payments', pspPaymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/contacts', contactRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId: string) => {
    if (!userId) {
      console.warn('Join attempt with no userId');
      return;
    }
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('join_admin', () => {
    socket.join('admin');
    console.log('Admin joined admin room');
  });

  socket.on('join_psp_token', (token: string) => {
    if (!token) {
      console.warn('Join PSP token attempt with no token');
      return;
    }
    socket.join(`psp_token:${token}`);
    console.log(`Customer joined PSP token room: ${token}`);
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'reason:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Make io accessible in controllers
app.set('io', io);

// Initialize notification service with Socket.IO instance
notificationService.setSocketIO(io);

// Error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

