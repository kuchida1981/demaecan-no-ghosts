import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      name: 'DemaecanNoGhosts',
      formats: ['iife'],
      fileName: () => 'demaecan-no-ghosts.user.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || 'unknown'),
    __IS_UNSTABLE__: process.env.VITE_IS_UNSTABLE === 'true',
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
