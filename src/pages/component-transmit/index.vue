<template>
	<div class="component-transmit">
		<TransmitProps />
		<el-divider />
		<ChildToParent />
		<el-divider />
		<VModelBind />
		<el-divider />
		<refs-control-child />
		<el-divider />
	</div>
</template>
<script setup lang="ts" name="componentTransmit">
	import { ref } from 'vue';
	import TransmitProps from './props/index.vue';
	import ChildToParent from './child-to-parent/index.vue';
	import VModelBind from './v-model-bind/index.vue';
	import RefsControlChild from './refs-control-child/index.vue';
</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>


	