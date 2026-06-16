require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Database Connection
connectDB();

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

app.use(limiter);

// CORS Configuration
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body Parser Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
const userRoutes = require('./routes/userRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');

app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/inquiries', inquiryRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Intelligent House Renting System API',
    version: '1.0.0',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    statusCode: 404,
  });
});

// Socket.IO Middleware & Events
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id}`);

  // Join a specific chat room
  socket.on('join_room', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.user.id} joined room ${chatId}`);
  });

  // Handle new message
  socket.on('send_message', async (data) => {
    // data should contain { chatId, receiverId, message }
    try {
      const Message = require('./models/Message');
      const Chat = require('./models/Chat');

      const newMessage = await Message.create({
        chatId: data.chatId,
        senderId: socket.user.id,
        receiverId: data.receiverId,
        message: data.message,
        messageType: 'text'
      });

      await Chat.findByIdAndUpdate(data.chatId, {
        lastMessage: newMessage._id
      });

      // Emit to everyone in the room (including sender to confirm, or they can use the response)
      io.to(data.chatId).emit('receive_message', newMessage);
    } catch (error) {
      console.error('Socket error sending message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

// Error Handling Middleware (must be last)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});