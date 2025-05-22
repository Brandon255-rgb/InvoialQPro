import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { registerRoutes } from './routes';
import { startRecurringInvoiceCron } from './cron/recurring';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createServer() {
  const app = express();

  // Security headers
  app.use(helmet());

  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect('https://' + req.headers.host + req.url);
      }
      next();
    });
  }

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Register all routes and get the server
  const server = await registerRoutes(app);

  // Use port 5001 explicitly
  const port = 5001;
  server.listen(port, () => {
    startRecurringInvoiceCron();
  });
}

createServer().catch((e) => {
  console.error('Error starting server:', e);
  process.exit(1);
});
