<template>
    <div class="color-picker">
		<img :src="colorSelectImg" width="500px" alt="" />
		<div class="right">
			<a-button @click="picker()">Picker</a-button>
			<div
				v-for="color in colors"
				:key="color.key"
				class="color-item"
				style={{ backgroundColor: color.color }}
				@click="copyColor(color)"
			>
				{{ color.color }}
			</div>
		</div>
	</div>
</template>
<script setup lang="ts" name="colorPicker">
import { ref } from 'vue';
import { ColorPicker } from './color-picker';
import colorSelectImg from './color_select.jpg'

interface ColorItem {
	color: string
	key: number
}
let colorKey = 1;
const colors = ref<ColorItem[]>([]);

const colorChange = (color: string) => {
	const newColors = [
		{
			color,
			key: ++colorKey
		},
		...colors.value
	];
	colors.value = newColors.slice(0, 5);
};

const colorPicker = new ColorPicker(colorChange)
const picker = () => {
    if (colorPicker) {
      colorPicker.open();
    }
};
const copyColor = (color: ColorItem) => {
    alert(color.color);
};
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
