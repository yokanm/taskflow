import { serverApp } from './app.ts';
import { connectDb } from './lib/db.ts';

const PORT = parseInt(process.env['PORT'] ?? '3000');

const startServer = async () => {
  try {
    await connectDb();
    const app = serverApp();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();