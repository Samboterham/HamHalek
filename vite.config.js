import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost',
                changeOrigin: true,
                rewrite: (path) => `/HamHalek${path}`,
            },
            '/images': {
                target: 'http://localhost',
                changeOrigin: true,
                rewrite: (path) => `/HamHalek${path}`,
            },
        },
    },
});
