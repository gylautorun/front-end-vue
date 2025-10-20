<template>
  <div class="parent">
    {{ parent }}
    <Children />
  </div>
</template>
<script lang="ts" setup>
import Children from "./components/children.vue";
const parent = ref("parent");
setInterval(() => {
  parent.value = `parent:${Math.random()}`;
}, 3000);
onUpdated(() => {
  console.log("父组件更新了");
});
</script>
