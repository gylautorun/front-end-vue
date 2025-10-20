declare global {
    interface Window {
        WEB_CONTEXT: string;
        API_CONTEXT: string;
        PROXY_PATH: string;
    }
	interface Navigator {
		msSaveOrOpenBlob: (blob: Blob, fileName: string) => void;
		browserLanguage: string;
	}
}

export const WEB_CONTEXT = window.WEB_CONTEXT;
export const API_CONTEXT = window.API_CONTEXT;
export const PROXY_PATH = window.PROXY_PATH;



export declare namespace Menu {
	interface MenuOptions {
		path: string;
		name: string;
		component?: string | (() => Promise<unknown>);
		redirect?: string;
		meta: MetaProps;
		children?: MenuOptions[];
	}
	interface MetaProps {
		icon: string;
		title: string;
		activeMenu?: string;
		isLink?: string;
		isHide: boolean;
		isFull: boolean;
		isAffix: boolean;
		isKeepAlive: boolean;
	}
}
