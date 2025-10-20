// 项目信息
import {dependencies, devDependencies, name, version} from '../package.json';
import dayjs from 'dayjs';
const __APP_INFO__ = {
	pkg: {dependencies, devDependencies, name, version},
	lastBuildTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
};

export function createViteDefine() {
    return {
        __APP_INFO__: JSON.stringify(__APP_INFO__),
    };
}
