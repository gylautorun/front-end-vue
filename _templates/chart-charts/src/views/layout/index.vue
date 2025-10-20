<template>
  <div class="app-wrapper">
    <!-- 遮罩层 -->
    <div class="app-mask" v-if="false" />
    <!-- 纵向菜单 -->
    <Vertical />
    <!-- 主体 -->
    <div class="main-container">
      <!-- 横向菜单 -->
      <LayoutHeader />
      <!-- 主体内容 -->
      <AppMain />
    </div>
  </div>
</template>
<script lang="ts" setup>
// import Horizontal from './components/sidebar/horizontal.vue'
import Vertical from "./components/sidebar/vertical.vue";
import AppMain from "./components/appMain.vue";
import { LayoutHeader } from "./components/layoutHeader";
</script>
<style lang="scss" scoped></style>
