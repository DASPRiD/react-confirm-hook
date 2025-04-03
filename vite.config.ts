import path from 'path';
import dts from 'vite-plugin-dts'
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
    plugins: [
        react(),
        dts(),
    ],
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'ReactConfirmHook',
            fileName: format => `react-confirm-hook.${format}.js`,
        },
        rollupOptions: {
            external: ['react', 'react/jsx-runtime'],
            output: {
                globals: {
                    react: 'React',
                    "react/jsx-runtime": "JSX",
                },
            },
        },
    },
    test: {
        environment: "jsdom",
        globals: true,
        coverage: {
            include: ["src"],
        },
    },
});
