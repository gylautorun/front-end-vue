import path from 'path';
import {UserConfig} from 'vite';

export function createViteResolve(): UserConfig['resolve'] {
    return {
        alias: {
            '@': path.resolve('src'),
            'src': path.resolve('src'),
            'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue'],
    };
}