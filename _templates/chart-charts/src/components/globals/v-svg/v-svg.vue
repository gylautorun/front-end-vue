<template>
  <svg class="icon" aria-hidden="true" :style="{ fill: color }">
    <use :xlink:href="`#${name}`" />
  </svg>
</template>
<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "VSvg",
  props: {
    name: {
      type: String,
      default: ""
    },
    color: {
      type: String,
      default: "currentColor"
    }
  }
  //   setup() {
  //     return {
  //     }
  //   }
});
</script>
<style lang="scss">
.icon {
  width: 1em;
  height: 1em;
  overflow: hidden;
  vertical-align: -0.15em;
  fill: currentColor;
}
</style>
