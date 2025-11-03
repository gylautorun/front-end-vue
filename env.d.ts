/// <reference types="vite/client" />

declare module 'vue3-odometer' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
    export default component;
}
