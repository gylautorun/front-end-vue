import { defineStore } from 'pinia';
import {defaultSettings} from '../type/settings';
import { useStorage } from '@vueuse/core';
import { Ref, ref } from 'vue';

export const useSettingsStore = defineStore('setting', () => {
    const title = defaultSettings.title;

    const tagsView = useStorage<boolean>('tagsView', defaultSettings.tagsView);

    const showSettings = ref<boolean>(defaultSettings.showSettings);
    const sidebarLogo = ref<boolean>(defaultSettings.sidebarLogo);
    const fixedHeader = useStorage<boolean>(
        'fixedHeader',
        defaultSettings.fixedHeader
    );
    const layout = useStorage<string>('layout', defaultSettings.layout);
    const themeColor = useStorage<string>(
        'themeColor',
        defaultSettings.theme
    );
    const theme = useStorage<string>('theme', defaultSettings.theme);


    const settingsMap: Record<string, Ref<any>> = {
        showSettings,
        fixedHeader,
        tagsView,
        sidebarLogo,
        layout,
        themeColor,
        theme,
    };

    function changeSetting({ key, value }: { key: string; value: any }) {
        const setting = settingsMap[key];
        if (setting !== undefined) {
            setting.value = value;
            if (key === 'theme') {
                if (value === 'dark') {
                    document.documentElement.classList.add('dark');
                }
                else {
                    document.documentElement.classList.remove('dark');
                }
            }
        }
    }

    return {
        title,
        showSettings,
        tagsView,
        fixedHeader,
        sidebarLogo,
        layout,
        themeColor,
        changeSetting,
        theme,
    };
});
