import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dineflow/database': path.resolve(__dirname, './packages/database/src'),
      '@dineflow/core': path.resolve(__dirname, './packages/core/src'),
      '@dineflow/ui': path.resolve(__dirname, './packages/ui/src'),
      '@dineflow/app-admin': path.resolve(__dirname, './apps/admin/src'),
      '@dineflow/app-superadmin': path.resolve(__dirname, './apps/superadmin/src'),
      '@dineflow/app-landing': path.resolve(__dirname, './apps/landing/src'),
      '@dineflow/app-guest': path.resolve(__dirname, './apps/guest/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
