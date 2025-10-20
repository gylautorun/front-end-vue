import {defineStore} from 'pinia';

export const useHome = defineStore('home', {
    // 相当于data
    state: () => {
        return {
            // 所有这些属性都将自动推断其类型,如果推断失败可以试下 as xxx
            counter: 0,
            name: 'Eduardo'
        };
    },
    // 相当于计算属性
    getters: {
        doubleCount: (state) => {
            return state.counter * 2;
        }
    },
    // 相当于vuex的 mutation + action，可以同时写同步和异步的代码
    actions: {
        /**
         * 递增计数器
         *
         * 该方法用于将类的计数器属性（counter）递增1。
         */
        increment() {
            this.counter++;
        },
        /**
         * 递减计数器
         */
        decrement() {
            this.counter--;
        },
        /**
         * 随机化计数器
         */
        randomizeCounter() {
            this.counter = Math.round(100 * Math.random());
        }
    },
});

