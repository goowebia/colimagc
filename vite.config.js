import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        torneo: resolve(__dirname, 'torneo/index.html'),
        oyes: resolve(__dirname, 'oyes/index.html'),
      },
    },
  },
});
