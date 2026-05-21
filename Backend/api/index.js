import serverless from 'serverless-http';
import app from '../app.js';

// Vercel serverless entry — REST API only (no Socket.io).
export default serverless(app);
