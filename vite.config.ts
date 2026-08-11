import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/i': 'http://localhost:3001',
      '/c': 'http://localhost:3001'
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist'
  }
});
