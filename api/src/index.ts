import { serverApp } from './app.ts';

const PORT = 3000;
const startServer = async () => {
try {
const app = serverApp();

app.listen(PORT, () => {
console.log(`Running on Port ${PORT}`);
});
} catch (error) {
console.error('Error starting server:', error);
}
};

startServer();
