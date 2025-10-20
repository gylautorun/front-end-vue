<template>
	<div 
        class="card-wrap"
        @transitionend="slideEnd"
        @click.stop="targetClick"
        :style="cardStyle"
        v-html="content"
	>
    </div>
</template>
<script setup lang="ts" name="Card">
import mitt from '@/utils/event-mitt';
import { ref, computed, PropType } from 'vue';
import { TreeData } from '../tree/type';

const props = defineProps({
	data:{
		type: Object as PropType<TreeData | null>,
		required: true,
		default: null,
	},
	innerParams: {
		type: Object,
		required: true,
		default: null,
	},
	isActive: {
		type: Boolean,
		required: false,
		default: false
	},
});

const content = computed(() => {
	const appendHTML = props.innerParams.appendHTML;
		if (appendHTML) {
			if (typeof appendHTML === 'function') {
				return appendHTML(props.data);
			}
			return appendHTML.replace(/\${(.+?)\}/g, (_: string, tag: string) => {
				if (!props.data) {
					return '';
				}
				return props.data[tag];
			});
		}
		return '';
});
const cardStyle = computed(() => {
	const {cardHeight, borderColor, highlightColor, highlightShadow} = props.innerParams.style;
	const obj: {
		height: string;
		borderColor: string;
		boxShadow?: string;
	} = {
		height: `${cardHeight}px`,
		borderColor,
	};
	if (props.isActive) {
		obj.borderColor = highlightColor;
		obj.boxShadow = highlightShadow;
	}
	return obj;
});

function targetClick(e: MouseEvent) {
	mitt.emit('showTargetDetail', props.data);
}
function slideEnd(event: Event) {
	event.stopPropagation();
}
</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>


	