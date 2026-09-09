import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [
    react(),
    eslint({ failOnError: true }),
  ],

  css: {
    postcss: false,
  },

  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});