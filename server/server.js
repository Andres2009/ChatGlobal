import express from 'express';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import multer from 'multer';
import { registerSocketHandlers } from './socket/socketHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const distPath    = path.join(__dirname, '../dist');
const uploadsPath = path.join(__dirname, 'uploads');
const hasDist     = fs.existsSync(path.join(distPath, 'index.html'));

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

const PORT          = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || (hasDist ? true : 'http://localhost:5173');

const app        = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
});

// ── File upload ───────────────────────────────────────────────────────────────
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const storage = multer.diskStorage({
  destination: uploadsPath,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    ALLOWED_MIME.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Solo se permiten imágenes (JPG, PNG, GIF, WEBP).'));
  },
});

app.post('/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsPath));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Static frontend (production) ──────────────────────────────────────────────
if (hasDist) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io') || req.path.startsWith('/uploads') || req.path === '/upload') {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'), (error) => {
      if (error) next(error);
    });
  });
} else {
  app.get('/', (_req, res) => {
    res.status(200).type('html').send(`<!DOCTYPE html>
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
