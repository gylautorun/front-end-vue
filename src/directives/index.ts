import { App, Directive } from 'vue';
import auth from './modules/auth';
import copy from './modules/copy';
import draggable from './modules/draggable';
import debounce from './modules/debounce';
import throttle from './modules/throttle';
import longpress from './modules/longpress';
import waterMarker from './modules/water-marker';

const directivesObject: { [key: string]: Directive } = {
	auth,
	copy,
	draggable,
	debounce,
	throttle,
	longpress,
	waterMarker
};

const directives = {
	install: function (app: App<Element>) {
		Object.keys(directivesObject).forEach(key => {
			app.directive(key, directivesObject[key]);
		});
	}
};

export default directives;
