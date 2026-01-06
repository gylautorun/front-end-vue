<template>
    <div class="large-model-transformers-container">
        <h2>{{ page.title }}</h2>
        <p>大模型transformers功能模块</p>
        <div class="feature-list">
            <h3>功能列表</h3>
            <ul>
                <li>
                    <router-link to="/large-model-transformers/image-recognition"
                        >图片识别</router-link
                    >
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import page from './page';
</script>

<style scoped lang="scss">
.large-model-transformers-container {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;

    h2 {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 20px;
        color: #333;
    }

    p {
        font-size: 16px;
        color: #666;
        margin-bottom: 30px;
    }

    .feature-list {
        background-color: #f5f7fa;
        padding: 20px;
        border-radius: 8px;

        h3 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #333;
        }

        ul {
            list-style: none;
            padding: 0;

            li {
                margin-bottom: 10px;

                a {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #409eff;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    transition: background-color 0.3s;

                    &:hover {
                        background-color: #66b1ff;
                    }
                }
            }
        }
    }
}
</style>
