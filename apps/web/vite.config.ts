import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '../..',
  server: { port: Number(process.env.MATCHIQ_WEB_PORT ?? 5173), proxy: { '/api': `http://127.0.0.1:${process.env.MATCHIQ_API_PORT ?? 3001}` } },
  build: { rollupOptions: { output: { manualChunks: { charts: ['recharts'], react: ['react', 'react-dom', 'react-router-dom'] } } } },
});
