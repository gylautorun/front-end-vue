<template>
  <div class="container">
    <MessageList :messages="messages" />
    <button @click="addMessage">添加 Message</button>
  </div>
</template>

<script setup lang="ts">
  import { reactive } from 'vue';
  import MessageList from './message-list.vue';

  const messages = reactive<string[]>([
    'Message 1',
    'Message 2',
    'Message 3',
    'Message 4',
    'Message 5',
  ]);

  const addMessage = () => {
    messages.push(`Message ${messages.length + 1}`);
  };
</script>

<style scoped lang="scss">
  .container {
    text-align: center;
    margin-top: 50px;
  }
</style>
