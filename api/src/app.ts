import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes.ts';
import tasksRouter from './routes/task.routes.ts';
import projectRouter from './routes/project.routes.ts';
import userRouter from './routes/user.routes.ts';

export function serverApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env['CLIENT_URL'], credentials: true }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/v1/', (_req, res) => {
    res.status(200).json({ message: 'API is running in v1' });
  });

  app.use('/api/v1', authRouter);
  app.use('/api/v1/tasks', tasksRouter);
  app.use('/api/v1/projects', projectRouter);
  app.use('/api/v1/users', userRouter);

  return app;
}