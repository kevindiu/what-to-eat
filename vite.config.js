import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
    base: '/',
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
            injectRegister: 'auto',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
            manifest: {
                name: '食乜好',
                short_name: '食乜好',
                description: '唔知食咩好果陣幫你揀餐廳',
                theme_color: '#fff5f5',
                background_color: '#fff5f5',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: 'icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
                cleanupOutdatedCaches: true,
                navigateFallback: 'index.html'
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
