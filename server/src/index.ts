import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import router from './routes';
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

  // Mount the router
  app.use('/api', router);

  // Use port 5000 explicitly
  const port = 5000;
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    startRecurringInvoiceCron();
  });

  return server;
}

createServer().catch((e) => {
  console.error('Error starting server:', e);
  process.exit(1);
});
