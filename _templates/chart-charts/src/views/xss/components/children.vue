<template>
  <div class="children">
    {{ children }}
    {{ msg }}
    <button @click="modify">修改</button>
  </div>
</template>
<script lang="ts" setup>
defineProps({
  msg: {
    type: String,
    default: ""
  }
});
const children = ref("children");
const modify = () => {
  children.value = `children:${Math.random()}`;
};
onUpdated(() => {
  console.log("子组件更新了");
});
</script>
