import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// Served from https://gdakota222.github.io/jnj-wheel-spinner/
// Every asset path, the service worker scope, and the manifest start_url derive
// from this. Getting it wrong produces a blank page with 404s on every asset.
const BASE = '/jnj-wheel-spinner/';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: BASE,
        name: 'JnJ Wheel Spinner',
        short_name: 'JnJ Wheel',
        description:
          'Spin to pair dancers into leader/follower couples for a social Jack & Jill, and draw dance prompts for each pair.',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1a142c',
        theme_color: '#1a142c',
        icons: [
          { src: `${BASE}icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${BASE}icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: `${BASE}icon-maskable-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        // lets the service worker be exercised in `npm run dev`
        enabled: true,
        type: 'module',
      },
    }),
  ],
});
