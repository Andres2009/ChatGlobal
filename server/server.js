import express from 'express';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socket/socketHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');
const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || (hasDist ? true : 'http://localhost:5173');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (hasDist) {
  app.use(express.static(distPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io')) {
      next();
      return;
    }

    res.sendFile(path.join(distPath, 'index.html'), (error) => {
      if (error) next(error);
    });
  });
} else {
  app.get('/', (_req, res) => {
    res
      .status(200)
      .type('html')
      .send(`<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Chat en Tiempo Real</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 640px; margin: 3rem auto; padding: 0 1rem; color: #1f2937; }
      code { background: #f3f4f6; padding: 0.15rem 0.4rem; border-radius: 6px; }
      a { color: #5865f2; }
    </style>
  </head>
  <body>
    <h1>Servidor del chat activo</h1>
    <p>En desarrollo, abre el frontend en <a href="http://localhost:5173">http://localhost:5173</a>.</p>
    <p>En producción, ejecuta <code>npm run build</code> y luego <code>npm start</code>.</p>
  </body>
</html>`);
  });
}

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  const mode = hasDist ? 'producción' : 'desarrollo';
  console.log(`Servidor Socket.IO (${mode}) en http://localhost:${PORT}`);
});
