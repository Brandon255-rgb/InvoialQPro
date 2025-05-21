import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
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

  // API routes
  app.use('/api', router);

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
    root: resolve(__dirname, '../client'),
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(resolve(__dirname, '../client/dist')));
  }

  // Handle all routes for SPA
  app.use('*', async (req, res) => {
    const url = req.originalUrl;

    try {
      // Read index.html
      const indexHtml = await vite.ssrLoadModule('/index.html');
      let template = typeof indexHtml === 'string' ? indexHtml : '';

      // Apply Vite HTML transforms
      template = await vite.transformIndexHtml(url, template);

      // Send the rendered HTML back
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      // If an error is caught, let Vite fix the stack trace
      vite.ssrFixStacktrace(e as Error);
      console.error(e);
      res.status(500).end((e as Error).stack);
    }
  });

  const port = process.env.PORT || 5001;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    
    // Start recurring invoice cron job
    startRecurringInvoiceCron();
    console.log('Recurring invoice cron job started');
  });
}

createServer().catch((e) => {
  console.error('Error starting server:', e);
  process.exit(1);
});
