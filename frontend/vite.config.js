import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/analyze': { target: 'http://localhost:8000', changeOrigin: true },
      '/profile':  { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: false },
  optimizeDeps: { include: ['three', '@react-three/fiber', '@react-three/drei'] },
});
