<template>
    <div class="message-list" ref="messageList">
        <div class="message-wrapper" ref="messageWrapper">
            <div class="message-item" v-for="(message, index) in extendedMessages" :key="index">
                {{ message }}
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
    import {ref, onMounted, onBeforeUnmount, reactive, computed, watch} from 'vue';

    const props = defineProps<{
        messages: string[];
    }>();

    const extendedMessages = ref<string[]>([]);
    const scrollInterval = ref<number>(0);

    const messageList = ref<HTMLDivElement | null>(null);
    const messageWrapper = ref<HTMLDivElement | null>(null);

    onMounted(() => {
        extendedMessages.value = [...props.messages, ...props.messages];
        startScrolling();
    });
    onBeforeUnmount(() => {
        stopScrolling();
    });

    function startScrolling() {
        const messageEle = messageList.value;
        const messageWrapperEle = messageWrapper.value;
        let scrollAmount = 0;

        const scroll = () => {
            scrollAmount += 1;
            if (messageWrapperEle) {
                messageWrapperEle.style.transform = `translateY(-${scrollAmount}px)`;
                if (scrollAmount >= messageWrapperEle.clientHeight / 2) {
                    scrollAmount = 0;
                }
            }

            scrollInterval.value = requestAnimationFrame(scroll);
        };
        scrollInterval.value = requestAnimationFrame(scroll);
    }
    function stopScrolling() {
        scrollInterval.value = 0;
        cancelAnimationFrame(scrollInterval.value);
    }

    watch(
        props.messages,
        () => {
            extendedMessages.value = [...props.messages, ...props.messages];
            stopScrolling();
            startScrolling();
        },
        {
            deep: true
        }
    );

</script>
<style lang="scss" scoped>
    .message-list {
        overflow: hidden;
        height: 200px; /* 根据需要调整高度 */
        position: relative;
    }
    .message-wrapper {
        transition: transform 0.1s linear;
    }
    .message-item {
        height: 50px; /* 根据需要调整每个消息项的高度 */
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>

