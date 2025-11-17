const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initializeSocket } = require('./socket/socketHandler');
const aiStudyPartner = require('./services/aiStudyPartner');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
// Configure CORS for both Express and Socket.IO
const defaultAllowedOrigins = [
  'https://admin.kibetronoh.com',
  'https://super.admin.kibetronoh.com',
  'https://kibetronoh.com',
  'https://eduvault-exms.onrender.com',
  'https://68dc2615ba397bb2188ac9e7--warm-tiramisu-bf5ea3.netlify.app',
  'https://egerton-ai.onrender.com',
  'https://egertonai.aurafixx.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : defaultAllowedOrigins;

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

// Apply CORS to all routes
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Initialize Socket.IO
initializeSocket(io);

// Make io accessible to routes
app.set('io', io);

// Security middleware with custom CSP for secure image viewing
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://*"],
      connectSrc: ["'self'", "https://eduvault-exms.onrender.com", "wss://eduvault-exms.onrender.com"],
      frameAncestors: [
        "'self'", 
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:3002", 
        "https://admin.kibetronoh.com",
        "https://super.admin.kibetronoh.com",
        "https://kibetronoh.com"
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  }
}));
app.use(compression());
app.use(morgan('combined'));

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests in dev, 100 in prod
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use(limiter);

// CORS configuration - handle preflight requests
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy disallows origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Body parsing middleware with increased limits for file uploads
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Increase server timeout for file uploads
app.use((req, res, next) => {
  // Set longer timeout for upload routes
  if (req.path.includes('/upload')) {
    req.setTimeout(600000); // 10 minutes for uploads
    res.setTimeout(600000); // 10 minutes for uploads
  }
  next();
});

// MongoDB Atlas connection
const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds for Atlas
      socketTimeoutMS: 45000,
      retryWrites: true
    });
    console.log('✅ MongoDB Atlas connected successfully');
    console.log('📊 Database:', mongoose.connection.name);
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error.message);
    console.error('🔧 Please check your Atlas configuration and IP whitelist');
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/resources', require('./routes/resources')); // Resources routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', require('./routes/userManagement')); // User management routes
app.use('/api/admin', require('./routes/adminAssessments')); // Admin assessments routes
app.use('/api/secure-images', require('./routes/secureImages')); // Secure image serving - MUST be before catsExams
app.use('/api', require('./routes/catsExams')); // CATs and Exams routes
app.use('/api/content-approval', require('./routes/contentApproval'));
app.use('/api/student', require('./routes/studentContent'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/student-downloads', require('./routes/studentDownloads'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/ai', require('./routes/ai')); // AI integration routes (Local Ollama)
app.use('/api/exam-papers', require('./routes/examPapers')); // Exam papers for AI training

// Debug route logging
console.log('Mounting gamification routes at /api/gamify');
app.use('/api/gamify', (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}, require('./routes/gamification')); // Gamification system
app.use('/api/debug', require('./routes/debugContent')); // Debug content routes
app.use('/api/public', require('./routes/public')); // Public routes (e.g., success stories)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working correctly',
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    routes: 'loaded'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Handle favicon and static file requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Handle other common static file requests
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /api/\nDisallow: /admin/');
});

// Serve uploaded files securely (only for authenticated users)
app.use('/uploads', (req, res, next) => {
  let token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required for file access' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Invalid token for static upload access:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}, express.static(path.join(__dirname, 'uploads')));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Socket.IO enabled for real-time notifications`);

  // Check Egerton AI (Ollama) status on startup
  (async () => {
    try {
      console.log('🧠 Checking Egerton AI (Ollama) status...');
      const status = await aiStudyPartner.checkConnection();

      if (status.connected && status.modelAvailable) {
        console.log(`✅ Egerton AI is ACTIVE. Model: ${status.model}`);
      } else if (status.connected) {
        console.log(`⚠️ Egerton AI connected to Ollama, but model "${status.model}" is NOT available.`);
        if (status.availableModels && status.availableModels.length > 0) {
          console.log(`   Available models: ${status.availableModels.join(', ')}`);
        } else {
          console.log('   No models reported by Ollama.');
        }
      } else {
        console.log('❌ Egerton AI is NOT active.');
        if (status.error || status.message) {
          console.log(`   Reason: ${status.error || status.message}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to check Egerton AI status:', error.message);
    }
  })();
});
