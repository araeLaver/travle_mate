import express from 'express';
import cors from 'express'; // Assuming CORS is installed and imported like this for simplicity in this generated file, but ideally it should be `import cors from 'cors';`
// Correcting imports
import corsMiddleware from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

import http from 'http';
import { setupWebSocket } from './config/websocket';

import userRoutes from './routes/userRoutes';
import postRoutes from './routes/postRoutes';
import itineraryRoutes from './routes/itineraryRoutes';
import nftRoutes from './routes/nftRoutes';
import systemRoutes from './routes/systemRoutes';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.SERVER_PORT || 8080;

// Initialize WebSocket
setupWebSocket(server);

// Middleware
app.use(corsMiddleware({
  origin: process.env.CORS_ALLOWED_ORIGINS || '*'
}));
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files
const uploadDir = process.env.FILE_UPLOAD_PATH || 'uploads/';
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/nfts', nftRoutes);
app.use('/api/system', systemRoutes);

// Health Check
app.get('/api/health/live', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Node.js Backend is running' });
});

// Serve Frontend Static Files
// In the consolidated approach, we assume the React build is in /app/public or similar
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// API Routes Placeholder
app.use('/api', (req, res, next) => {
    if (req.path === '/health/live' || req.path === '/health') return next();
    res.status(404).json({ error: 'API route not found or not yet implemented in Node.js migration.' });
});

// SPA Fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(publicPath, 'index.html'));
  } else {
    next();
  }
});

// Start Server
server.listen(port, () => {
  console.log(`Node.js server listening on port ${port}`);
});
