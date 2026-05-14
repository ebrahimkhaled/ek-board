import { defineConfig } from 'vite';
import autoRegistry from './plugins/auto-registry.js';

export default defineConfig({
  base: './',
  publicDir: 'public',
  plugins: [autoRegistry()],
  server: {
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
