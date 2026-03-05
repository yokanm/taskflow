import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';


export function serverApp() {
    const app = express()

app.use(helmet());

app.use(
  cors({
    // origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));

app.get('/api/v1/', (_req, res) => {
    res.status(200).json({ message: 'API is running' });
  });
    return app;
}


