import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { connectToDatabase } from './config/database.js';
import { seedRolesAndPermissions } from './config/seedRolesPermissions.js';
import { seedAdminUser } from './config/seedAdmin.js';
// import { setupSwagger } from './config/swagger.js';
import { logger } from './config/logger.js';
import { validateEnvironment } from './config/validateEnv.js';
import authRoutes from './routes/auth.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import patientRoutes from './routes/patient.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import pharmacyRoutes from './routes/pharmacy.routes.js';
import labOrderRoutes from './routes/labOrder.routes.js';
import labResultRoutes from './routes/labResult.routes.js';
import documentRoutes from './routes/document.routes.js';
import healthRoutes from './routes/health.routes.js';
import permissionRoutes from './routes/permission.routes.js';
import userRoutes from './routes/user.routes.js';
import { generalLimiter, authLimiter, documentLimiter } from './middleware/rateLimiter.js';
import { auditMiddleware } from './middleware/auditLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\''],
      fontSrc: ['\'self\''],
      objectSrc: ['\'none\''],
      mediaSrc: ['\'self\''],
      frameSrc: ['\'none\'']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim());
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

if (process.env.NODE_ENV !== 'production') {
  // setupSwagger(app);
}

const API_VERSION = '/api/v1';

app.use('/health', healthRoutes);

app.use(`${API_VERSION}/auth`, authLimiter, authRoutes);
app.use(`${API_VERSION}/users`, generalLimiter, userRoutes);
app.use(`${API_VERSION}`, auditMiddleware);
app.use(`${API_VERSION}/appointments`, generalLimiter, appointmentRoutes);
app.use(`${API_VERSION}/patients`, generalLimiter, patientRoutes);
app.use(`${API_VERSION}/consultations`, generalLimiter, consultationRoutes);
app.use(`${API_VERSION}/prescriptions`, generalLimiter, prescriptionRoutes);
app.use(`${API_VERSION}/pharmacies`, generalLimiter, pharmacyRoutes);
app.use(`${API_VERSION}/lab-orders`, generalLimiter, labOrderRoutes);
app.use(`${API_VERSION}/lab-results`, generalLimiter, labResultRoutes);
app.use(`${API_VERSION}/documents`, documentLimiter, documentRoutes);
app.use(`${API_VERSION}`, generalLimiter, permissionRoutes);

app.get('/api', (req, res) => {
  res.json({
    message: 'CareFlow-EHR API',
    version: 'v1',
    status: 'active',
    endpoints: {
      v1: `${API_VERSION}`
    }
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CareFlow-EHR API' });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

app.use((err, req, res) => {
  logger.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectToDatabase();
    await seedRolesAndPermissions();
    await seedAdminUser();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
