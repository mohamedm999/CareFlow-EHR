import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser'; // Add this import
import { connectToDatabase } from './config/database.js';
import { seedRolesAndPermissions } from './config/seedRolesPermissions.js';
import { logger } from './config/logger.js';
import authRoutes from './routes/auth.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import patientRoutes from './routes/patient.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000', // Be specific instead of true
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware
app.use(morgan('dev'));


app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CareFlow-EHR API' });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    
    await connectToDatabase();
    
    
    await seedRolesAndPermissions();
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();