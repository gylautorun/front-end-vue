<template>
    <div>counter:{{counter}}</div>
    <div>doubleCount:{{doubleCount}}</div>
    <el-button @click="home.randomizeCounter()">counter(round)</el-button>
    <el-button type="primary" @click="home.increment()">counter++</el-button>
    <div>{{name}}</div>
    <a-button type="primary" @click="amend()">修改</a-button>
    <template v-for="(item, index) in icons" :key="index">
        <component :is="item.icon" />
    </template>
</template>

<script setup lang="ts">
    //引入想要的pinia文件 {} 里面就是对应导出的名字
    import { useHome } from '@/stores/home'
    import { storeToRefs } from 'pinia';
    import {ref} from 'vue';
    import { useIconRender } from '@/hooks/use-icons';

    const { iconRender } = useIconRender();

    const icons = [
        {
            icon: iconRender({
                localIcon: 'material-symbols-light:18mp-outline-rounded',
                color: 'green',
                fontSize: 30,
            }),
        },
        {
            icon: iconRender({
                icon: 'material-symbols-light:18mp-outline-rounded',
                color: 'red',
                fontSize: 30,
            }),
        },
        {
            icon: iconRender({
                localIcon: 'material-symbols-light:18mp-outline-rounded',
                color: 'green',
                fontSize: 30,
            }),
        },
    ];
    
    const home = useHome()
    // 解构main里面的state和getters的数据，
    // 使用storeToRefs解构才有响应式，响应式可以直接修改数据，这里只用来渲染
    let {counter, name, doubleCount} = storeToRefs(home);

    //（常用方法三种）
    //常用方法一： 使用数据
    console.log( counter );
    //使用方法(方法目前不能解构)
    home.increment()
    // 常用方法二：修改数据
    counter.value = 9999;

    //常用方法三：
    //进阶使用$patch，多个修改
    const amend= () => {
        home.$patch((state) => {
            state.counter += 10;
            state.name = '张三'
        })
    };

</script>

<style scoped>
</style>
