<template>
	<h2>当前视窗大小</h2>
	<div>width: {{windowSize.width}} height: {{windowSize.height}}</div>
</template>
<script setup lang="ts" name="combinationSize">
	import {useWindowSize} from '@/hooks/use-window-size';

	const windowSize = useWindowSize();
</script>
<style scoped lang="scss">
</style>


	