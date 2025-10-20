import { createI18n } from 'vue-i18n';
import type { App } from 'vue';
// import { useAppStore } from '@/stores/modules/app';

// 本地语言包
import enLocale from './en-us/common';
import zhCnLocale from './zh-cn/common';
import { LOCAL_KEY } from '@/config/local-key';

// const appStore = useAppStore();
const appStore = {language: localStorage.getItem(LOCAL_KEY.LANGUAGE)};

export type I18nTypeEnum = typeof zhCnLocale;
const messages: Record<string, I18nTypeEnum> = {
    'zh-cn': zhCnLocale,
    'en': enLocale,
};

export const i18n = createI18n({
    // 如果要支持 compositionAPI，此项必须设置为 false
    legacy: false,
    locale: appStore.language || 'zh-cn',
    messages: messages,
    // 全局注册$t方法
    globalInjection: true,
});

const { setLocaleMessage, locale, t } = i18n.global;
/**
 * @description 设置语言
 * @param index 语言类型索引
 */
const setLanguage = (index: 0 | 1 | 2) => {
    const langs = ['zh-cn', 'en'];
    const lang = langs[index];
    setLocaleMessage(lang, messages[lang]);
    locale.value = lang;
    localStorage.setItem(LOCAL_KEY.LANGUAGE, lang);
};

/**
 * @description 挂载
 */
const setupLanguage = (app: App) => {
    app.use(i18n);
};

//开发模式下按Ctrl + Q切换语言
if (import.meta.env.DEV) {
    document.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.key === 'q') {
            const obj: Record<string, 0 | 1> = {
                zh: 1,
                en: 0,
            };
            setLanguage(obj[locale.value]);
        }
    });
}

export {setupLanguage, setLanguage, t};
export default i18n;