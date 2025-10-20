<template>
  <div class="home">
    <div class="bar-chart">
      <v-charts type="bar" :options="options" @chart-click="handleChartClick" @selectchanged="selectchanged" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useStatisDeviceByUserObject } from "./hooks";
const { options, handleChartClick, selectchanged } = useStatisDeviceByUserObject();
</script>
<style lang="scss" scoped>
.bar-chart {
  height: 50vh;
}
</style>
