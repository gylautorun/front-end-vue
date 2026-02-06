<template>
    <a-card title="函数">
        <h3>{{ title }}</h3>

        <!-- 遍历所有部分 -->
        <div v-for="(section, sectionIndex) in sections" :key="sectionIndex" class="section">
            <h4 class="section-title">{{ section.title }}</h4>
            <p v-if="section.description" class="section-description">{{ section.description }}</p>

            <!-- 渲染列表（所有部分都使用统一的items结构） -->
            <ul v-if="section.items" class="section-items">
                <li v-for="(item, index) in section.items" :key="index" class="section-item">
                    <strong>{{ item.title }}</strong
                    >：{{ item.description }}
                </li>
            </ul>
        </div>
    </a-card>
</template>

<script setup lang="ts" name="arrow-function">
import { ref, onMounted, onUnmounted } from 'vue';

// 定义响应式数据
const title = ref('为什么要有箭头函数？');

const sections = ref([
    {
        title: '1. 函数的二义性',
        description: '在JavaScript中，函数的二义性主要体现在以下几个方面：',
        items: [
            {
                title: 'this指向不明确',
                description:
                    '传统函数的this指向取决于函数的调用方式，可能指向全局对象、调用对象、或使用call/apply/bind指定的对象，导致代码难以理解和维护。'
            },
            {
                title: '函数声明与表达式的区别',
                description:
                    '函数声明会被提升，而函数表达式不会，可能导致在定义前调用函数的行为不一致。'
            },
            {
                title: '构造函数与普通函数',
                description:
                    '任何函数都可以作为构造函数使用new关键字调用，即使它并不是为了创建对象而设计的。'
            }
        ]
    },
    {
        title: '2. 箭头函数的特点与优势',
        description: '箭头函数（Arrow Function）是ES6引入的新语法，主要解决了函数二义性的问题：',
        items: [
            {
                title: '词法作用域的this',
                description:
                    '箭头函数没有自己的this，它会捕获定义时所在作用域的this值，避免了this指向混乱的问题。'
            },
            {
                title: '简洁的语法',
                description:
                    '箭头函数的语法更简洁，特别是对于单行表达式，可以省略大括号和return关键字。'
            },
            {
                title: '不能作为构造函数',
                description: '箭头函数不能使用new关键字调用，避免了被误用作构造函数的情况。'
            },
            {
                title: '没有arguments对象',
                description:
                    '箭头函数没有自己的arguments对象，但可以使用剩余参数（rest parameters）代替。'
            },
            {
                title: '没有prototype属性',
                description: '箭头函数没有prototype属性，进一步明确了它不是为了创建对象而设计的。'
            }
        ]
    },
    {
        title: '3. 类函数的特点与优势',
        description:
            '类函数（Class Methods）是ES6引入类语法后，在类中定义的方法，具有以下重要作用：',
        items: [
            {
                title: '明确的上下文',
                description:
                    '类方法中的this指向类的实例，提供了更明确的上下文，避免了传统函数中this指向混乱的问题。'
            },
            {
                title: '封装性',
                description:
                    '类方法可以访问类的私有属性和方法，提供了更好的封装性，保护数据不被外部随意修改。'
            },
            {
                title: '继承性',
                description:
                    '类方法可以被子类继承和重写，支持面向对象的编程范式，提高代码的可复用性。'
            },
            {
                title: '静态方法',
                description: '类可以定义静态方法，不需要实例化即可调用，适用于工具函数等场景。'
            },
            {
                title: '消除构造函数二义性',
                description:
                    '类通过constructor关键字明确声明构造函数，避免了传统函数中普通函数与构造函数的混淆，使代码意图更清晰。'
            },
            {
                title: '方法定义的简洁性',
                description:
                    '类方法的定义语法简洁明了，避免了传统函数表达式赋值给原型的冗长写法，减少了出错的可能性。'
            },
            {
                title: '严格模式的自动应用',
                description:
                    '类声明和类表达式的主体都执行在严格模式下，因此类方法中的this不会自动绑定到全局对象，有助于捕获错误。'
            },
            {
                title: '私有方法的支持',
                description:
                    '现代JavaScript支持在类中定义私有方法（使用#前缀），进一步增强了封装性和代码安全性。'
            },
            {
                title: '与箭头函数的互补',
                description:
                    '类方法作为普通函数，保留了自己的this绑定能力，与箭头函数的词法作用域this形成互补，满足不同场景的需求。'
            }
        ]
    },
    {
        title: '4. 适用场景对比',
        description: '不同类型函数的适用场景：',
        items: [
            {
                title: '箭头函数适用场景',
                description:
                    '回调函数，特别是在数组方法（如map、filter、forEach）中；需要保持外部this指向的场景；简短的函数表达式'
            },
            {
                title: '类函数适用场景',
                description:
                    '面向对象编程中的方法定义；需要访问实例属性和方法的场景；需要被继承和重写的方法'
            },
            {
                title: '传统函数适用场景',
                description:
                    '需要作为构造函数使用的场景；需要自己的this指向的场景；需要使用arguments对象的场景'
            }
        ]
    }
]);
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
