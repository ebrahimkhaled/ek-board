import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'public',
  server: {
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
