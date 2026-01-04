import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
    base: '/what-to-eat/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: true,
        port: 5173,
    },
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            manifest: false, // We use the existing manifest.json in public/
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
                cleanupOutdatedCaches: true,
            },
            devOptions: {
                enabled: true,
            },
        }),
    ],
    build: {
        outDir: 'dist',
        content: ['**/*'],
    },
});
