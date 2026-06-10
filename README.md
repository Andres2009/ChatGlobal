# Chat en Tiempo Real

Aplicación de chat en tiempo real con React 19, Vite, Bootstrap 5 y Socket.IO. Sin autenticación, sin base de datos: todo vive en memoria del servidor.

## Requisitos

- Node.js 18 o superior
- npm

## Instalación

```bash
npm install
```

## Desarrollo

Inicia frontend y backend simultáneamente:

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001

Abre varias pestañas o ventanas en `http://localhost:5173` para probar el chat entre varios usuarios.

## Producción

```bash
npm run build
npm start
```

Abre la misma URL del servidor (por defecto `http://localhost:3001`). El backend sirve el frontend compilado desde `dist/`.

En Render u otro hosting:

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Variable opcional:** `CLIENT_ORIGIN` = URL pública del servicio (ej. `https://tu-app.onrender.com`)

> En desarrollo usa `http://localhost:5173`. Si abres solo `http://localhost:3001` sin haber hecho `build`, verás una página de ayuda, no el chat.

## Variables de entorno (opcional)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3001` |
| `CLIENT_ORIGIN` | Origen CORS del cliente | `http://localhost:5173` |
| `VITE_SOCKET_URL` | URL del servidor Socket.IO | `''` (usa proxy de Vite) |

## Arquitectura

```
realtime-chat/
├── server/
│   ├── models/          # ChatMessage, ConnectedUser
│   ├── services/        # MemoryStore (RAM)
│   ├── socket/          # Handlers Socket.IO
│   └── server.js
└── src/
    ├── components/      # UI React
    ├── context/         # ChatContext
    ├── hooks/           # useSocket, useChat
    ├── services/        # socketService
    └── styles/          # chat.css
```

## Eventos Socket.IO

| Cliente → Servidor | Servidor → Cliente |
|--------------------|--------------------|
| `join-chat` | `user-joined` |
| `send-message` | `user-left` |
| `edit-message` | `receive-message` |
| `disconnect` | `message-edited` |
| | `users-updated` |
| | `history-loaded` |

## Notas

- Al reiniciar el servidor se pierden usuarios, mensajes y salas.
- No se usa LocalStorage, SessionStorage ni cookies.
- El alias solo existe mientras la pestaña permanece abierta.
