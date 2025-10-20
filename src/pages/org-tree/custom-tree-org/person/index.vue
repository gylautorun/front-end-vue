<template>
	<div 
        v-if="personData"
        class="person-info-wrap"
        :class="{
            'person-active': isActive,
            'last-person-info-wrap': isLastPerson,
            'top-person-info-wrap': hierarchy === 'first'}"
        :style="cardStyle"
	>
        <div 
            v-if="hierarchy !== 'first'"
            class="connect-line"
            :class="{
                'line-right-angle': noRadius,
                'only-one': endIndex === startIndex,
                'line-right-radius': leftNoRadius,
                'line-left-radius': rightNoRadius}"
            :style="{
                height: `${personStyle.connectLineHeight}px`,
                top: `-${personStyle.connectLineHeight}px`}">
            <div 
                class="tree-vertical-line"
                :style="{
                    height: `${personStyle.connectLineHeight}px`,
                    borderColor: personStyle.borderColor}">
            </div>
            <div 
                class="tree-horizontal-line"
                :style="{
                    height: `${personStyle.connectLineHeight}px`,
                    width: `${personStyle.cardWidth + personStyle.cardMargin * 2}px`,
                    borderColor: personStyle.borderColor}">
            </div>
        </div>
        <card :data="personData" :inner-params="innerParams" :is-active="isActive" />
        <template v-if="showOpenBtn">
            <span 
                class="show-btn"
                :data-sub="personData.childrenCount || ''"
                :class="{'minus-btn': showMinus}"
                @click.stop="showSubordinate">
                <icon name="add" v-if="!showMinus" />
                <icon name="minus" v-else />
                <span
                    v-if="hasThird"
                    class="tree-vertical-line"
                    :style="{
                        height: `${personStyle.connectLineHeight - 7}px`,
                        borderColor: personStyle.borderColor}">
                </span>
            </span>
        </template>
    </div>
    <p 
        v-else 
        class="placeholder-info-wrap"
        :style="cardStyle">
    </p>
</template>
<script setup lang="ts" name="Person">
	import { ref, computed, PropType } from 'vue';
	import Card from '../card/index.vue';
    import { TreeData } from '../tree/type';

	// interface Props {
	// 	personData: Record<string, string | number>;
	// 	hasThird?: boolean;         // 可选
	// }
	// const props = defineProps<Props>();

	const props = defineProps({
		personData: { // 数据
            type: Object as PropType<TreeData>,
            required: true,
            default: {},
        },
        // 当前层级
        hierarchy: {
            type: String,
            required: true,
            default: ''
        },
        // 当前是否高亮
        isActive: {
            type: Boolean,
            required: true,
            default: false
        },
        // 显示操作按钮
        showOpenBtn: {
            type: Boolean,
            required: true,
            default: false
        },
        // 显示-按钮
        showMinus: {
            type: Boolean,
            required: false,
            default: false
        },
        // 是否是最后一个人
        isLastPerson: {
            type: Boolean,
            required: false,
            default: false
        },
        hasThird: {
            type: Boolean,
            required: false,
            default: true
        },
        // 当前人的index索引
        personIndex: {
            type: Number,
            required: false,
            default: 0
        },
        startIndex: {
            type: Number,
            required: false,
            default: 0
        },
        endIndex: {
            type: Number,
            required: false,
            default: 0
        },
        currentIndex: {
            type: Number,
            required: false,
            default: 0
        },
        secondCur: {
            type: Number,
            required: false,
            default: 0
        },
        secondStart: {
            type: Number,
            required: false,
            default: 0
        },
        secondEnd: {
            type: Number,
            required: false,
            default: 0
        },
        initNum: {
            type: Number,
            required: false,
            default: 0
        },
        length: {
            type: Number,
            required: false,
            default: 0
        },
        secondLength: {
            type: Number,
            required: false,
            default: 0
        },
        innerParams: {
            type: Object,
            required: true,
            default: null
        }
	});
	const emit = defineEmits(['personClick']); // 声明事件

	const noRadius = computed(() => {
		const num = props.secondCur - props.secondStart;
		// 第二层展开的卡片是最后一个并且是第三层的最后一个卡片
		const isLastOpen = num === props.initNum - 1
			&& props.personIndex === props.initNum - 2
			&& props.endIndex - props.startIndex !== 1;
		// 第二层展开的卡片位置在第三层的第一个卡片,并且第二层数据大于第三层数据
		const isThirdFirst = num === props.personIndex
			&& props.personIndex !== props.length - 2
			&& props.secondLength >= props.length;
		return isThirdFirst || isLastOpen || props.endIndex === props.startIndex;
	});
	const leftNoRadius = computed(() => {
		const num = props.secondCur - props.secondStart;
		const flag = props.hierarchy === 'second' && num || props.hierarchy !== 'second';
		return flag && num === props.personIndex && props.endIndex - props.startIndex === 1;
	});
	const rightNoRadius = computed(() => {
		const num = props.secondCur - props.secondStart;
		return num - 1 === props.personIndex;
	});
	const personStyle = computed(() => {
		const {cardWidth, connectLineHeight, borderColor, cardMargin} = props.innerParams.style;
		return {
			cardWidth,
			cardMargin,
			connectLineHeight,
			borderColor
		};
	});
	const cardStyle = computed(() => {
		const {cardWidth, cardHeight, cardMargin} = props.innerParams.style;
		return {
			width: `${cardWidth}px`,
			height: `${cardHeight}px`,
			margin: `0 ${cardMargin}px`
		};
	});

	function showSubordinate() {
		emit('personClick', {
			hierarchy: props.hierarchy,
			personData: props.personData,
			isOpen: props.personData.isOpen,
		});
	}
</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>


	