import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    if (mode === 'playground') {
        return { root: './playground' };
    }
    return {
        build: {
            lib: {
                entry: resolve(__dirname, './src/index.ts'),
                formats: ['es'],
            },
            sourcemap: true,
        },
        plugins: [dts()],
    };
});
