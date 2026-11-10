import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api requests are proxied to Express so cookies stay same-origin
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:4000' } },
});
