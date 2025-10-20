<template>
  <div class="traffic-lights" :class="activeColor">
    <div class="light" v-for="light in lights" :key="light.type" :class="light.type">
      <div v-show="light.type === activeColor" class="time">{{time}}</div>
    </div>
  </div>
</template>

<script setup lang="ts" name="trafficLights">
  import { ref } from 'vue';
  import {TrafficLight, TrafficLightColorEnum, ITrafficLightPart} from './traffic-light';

  const lights: ITrafficLightPart[] = [
    { type: TrafficLightColorEnum.Green, time: 60 * 1000 },
    { type: TrafficLightColorEnum.Yellow, time: 5 * 1000 },
    { type: TrafficLightColorEnum.Red, time: 30 * 1000 },
  ];
  const activeColor = ref<TrafficLightColorEnum>(TrafficLightColorEnum.Red);
  const time = ref<number>(0);
  const light = new TrafficLight(lights);

  function run() {
    requestAnimationFrame(run);
    const { type, remain } = light.getCurrentLight();
    activeColor.value = type;
    time.value = Math.ceil(remain / 1000);
  }
  run();
</script>

<style scoped lang="scss">
  @import url('./index.scss');
</style>
