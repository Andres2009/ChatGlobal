import { writeFileSync } from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Writes public/version.json with the build timestamp at every build
const buildVersionPlugin = () => ({
  name: 'build-version',
  buildStart() {
    writeFileSync('public/version.json', JSON.stringify({ v: Date.now().toString() }));
  },
});

export default defineConfig({
  plugins: [react(), buildVersionPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': { target: 'http://localhost:3001', ws: true },
      '/upload':    { target: 'http://localhost:3001' },
      '/uploads':   { target: 'http://localhost:3001' },
    },
  },
});
