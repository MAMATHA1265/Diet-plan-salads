import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initSupabase, isSupabaseConnected } from './server/config/supabase.ts';
import appointmentRoutes from './server/routes/appointments.ts';
import authRoutes from './server/routes/auth.ts';
import ingredientRoutes from './server/routes/ingredients.ts';
import memberRoutes from './server/routes/members.ts';
import orderRoutes from './server/routes/orders.ts';
import paymentRoutes from './server/routes/payments.ts';
import planRoutes from './server/routes/plans.ts';
import saladRoutes from './server/routes/salads.ts';
import subscriptionRoutes from './server/routes/subscriptions.ts';
import { ensureSeeded } from './server/utils/seedData.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  await initSupabase();
  await ensureSeeded();

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'Verdant Bowl API',
      storage: isSupabaseConnected() ? 'supabase' : 'local-store',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/plans', planRoutes);
  app.use('/api/salads', saladRoutes);
  app.use('/api/ingredients', ingredientRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/appointments', appointmentRoutes);

  // Serve generated static images directly in all modes
  const assetsImagesDir = path.resolve(process.cwd(), 'src/assets/images');
  if (fs.existsSync(assetsImagesDir)) {
    app.use('/src/assets/images', express.static(assetsImagesDir));
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Verdant Bowl running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
