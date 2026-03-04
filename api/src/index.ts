import { serverApp } from './app.ts';
import { connectDb } from './lib/db.ts';

const PORT = 3000;
const startServer = async () => {
try {
    await connectDb();
    const app = serverApp();

    app.listen(PORT, () => {
    console.log(`Running on Port ${PORT}`);
    });
} catch (error) {
    console.error('Error starting server:', error);
    }
};

startServer();
