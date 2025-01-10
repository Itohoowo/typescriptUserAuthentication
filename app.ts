// Import required modules
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import mongoose from 'mongoose';
import session from 'express-session';
import flash from 'connect-flash';
import dotenv from 'dotenv';
import path from 'path';
import authenticateToken from './middleware/authMiddleware';
import net from 'net';
import protectedRoutes from './middleware/protectedRoutes';
import indexRouter from './routes/index';
import usersRouter from './routes/users';
import authRouter from './routes/auth';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Set port
const port = 9000;

// Apply middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultSecret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gift?directConnection=true&serverSelectionTimeoutMS=5000&appName=mongosh+2.2.15';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set up routes
app.use('/', indexRouter);
app.use('/users', authenticateToken, usersRouter);
app.use('/auth', authRouter);
app.use('/protected', protectedRoutes); // Use protectedRoutes for routes that require authentication

// Catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  const err = new Error('Not Found');
  (err as any).status = 404;
  next(err);
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Function to check if port is in use
function checkPortInUse(port: number, callback: (inUse: boolean) => void) {
  const server = net.createServer();
  server.once('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      callback(true);
    } else {
      callback(false);
    }
  });
  server.once('listening', () => {
    server.close();
    callback(false);
  });
  server.listen(port);
}

export default app;