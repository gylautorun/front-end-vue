<template>
	<div class="combination">
		<combination-size />
		<el-divider />
		<combination-form />
		<el-divider />
	</div>
</template>
<script setup lang="ts" name="combination">
	import { ref } from 'vue';
	import combinationSize from './window-size.vue';
	import combinationForm from './form.vue';
</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>


	