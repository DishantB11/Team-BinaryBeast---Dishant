import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 👈 This maps @/ to ./src
    },
  },
  server: {
    port: 5174,     // Fixed port so Google OAuth origin never changes
    strictPort: true, // Fail instead of picking a random port
  },
});
