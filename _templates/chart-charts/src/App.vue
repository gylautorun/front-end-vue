<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
  </el-config-provider>
</template>

<script lang="ts" setup>
import zhCn from "element-plus/lib/locale/lang/zh-cn";
import en from "element-plus/lib/locale/lang/en";
// import { http } from "/@/utils/axios";

defineOptions({
  name: "App"
});

const currentLocale = computed(() => (localStorage.locale === "zh" ? zhCn : en));
</script>
