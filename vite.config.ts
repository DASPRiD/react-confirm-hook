import path from 'path';
import typescript from '@rollup/plugin-typescript';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
    plugins: [
        react(),
        typescript({
            declaration: true,
            declarationDir: path.resolve(__dirname, 'dist'),
        }),
    ],
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'ReactConfirmHook',
            fileName: format => `react-confirm-hook.${format}.js`,
        },
        rollupOptions: {
            external: ['react'],
            output: {
                globals: {
                    react: 'React',
                },
            },
        },
    },
});
