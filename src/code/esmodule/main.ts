import foo from './foo';

import('./dynamic').then((module) => {
    console.log('dynamic', module.default);
});
console.log('main', foo, bar);
import bar from './bar';
