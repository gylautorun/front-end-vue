<template>
	<div class="org-tree">
		<div class="control">
			<div><el-switch v-model="horizontal"></el-switch>横向</div>
			<div><el-switch v-model="collapsable"></el-switch>可收起</div>
			<div><el-switch v-model="disabled"></el-switch>禁止编辑</div>
			<div><el-switch v-model="onlyOneNode"></el-switch>仅拖动当前节点</div>
			<div><el-switch v-model="cloneNodeDrag"></el-switch>拖动节点副本</div>
		</div>
		<div class="colors">
			背景色：<el-color-picker v-model="style.background" size="small"></el-color-picker>&nbsp;
			文字颜色：<el-color-picker v-model="style.color" size="small"></el-color-picker>&nbsp;
		</div>
		<div class="tree-content">
			<vue3TreeOrg
				:data="data"
				:node-draggable="true"
				:props="{id: 'id', label: 'label', children: 'children'}"
				center
				:horizontal="horizontal"
				:disabled="disabled"
				:collapsable="collapsable"
				:label-style="style"
				:only-one-node="onlyOneNode"
				:clone-node-drag="cloneNodeDrag"
				:before-drag-end="beforeDragEnd"
				:toolBar="{scale: false, restore: false, expand: false, zoom: false, fullscreen: false, center: true}"
				@on-node-drag="nodeDragMove"
				@on-node-drag-end="nodeDragEnd"
				@on-contextmenu="onMenus"
				@on-expand="onExpand"
				@on-node-dblclick="onNodeDblclick"
				@on-node-click="onNodeClick"
			/>
		</div>
	</div>
</template>
<script setup lang="ts" name="baseTree">
	import { ref, reactive, getCurrentInstance, defineAsyncComponent } from 'vue';
	import { ElSwitch, ElColorPicker, ElMessage } from 'element-plus';
	// import vue3TreeOrg from 'vue3-tree-org';
	// 动态注册组件
	const instance = getCurrentInstance(); // 获取当前实例的 app 对象
	
	interface Node {
		id: number;
		label: string;
		children?: Node[];
		expand?: boolean;
		deptName?: string;
	}

    // const instance = getCurrentInstance();
	const data: Node = reactive({
		id: 0,
		label: 'XXX科技有限公司',
		children: [
			{
				id: 2,
				label: '产品研发部',
				children: [
					{
						id: 5,
						label: '研发-前端'
					},
					{
						id: 6,
						label: '研发-后端'
					},
					{
						id: 9,
						label: 'UI设计'
					},
					{
						id: 10,
						label: '产品经理'
					}
				]
			},
			{
				id: 3,
				label: '销售部',
				children: [
					{
						id: 7,
						label: '销售一部'
					},
					{
						id: 8,
						label: '销售二部'
					}
				]
			},
			{
				id: 4,
				label: '财务部'
			},
			{
				id: 9,
				label: 'HR人事'
			}
		],
	});
	const cloneNodeDrag = ref(false);
	const horizontal = ref(false);
	const collapsable = ref(false);
	const onlyOneNode = ref(true);
	const expandAll = ref(true);
	const disabled = ref(true);
	const style = ref({
		background: '#FFF',
		color: '#5E6D82',
	});

	toggleExpand(data, expandAll.value);

	function onMenus({node, command}: {node: Node, command: string}) {
        console.log(node, command);
    }
	function onExpand(e: Event, data: Node) {
		console.log(e, data);
	}
	function onExpandAll(b: boolean) {
		console.log(b);
	}
	function nodeDragMove(data: Node) {
		console.log(data);
	}
	function beforeDragEnd(node: Node, targetNode: Node) {
		return new Promise((resolve, reject) => {
			if (!targetNode) {
				reject();
			};
			if (node.id === targetNode.id) {
				void reject();
			}
			else {
				void resolve(node);
			}
		})
	}
	function nodeDragEnd(data: Node, isSelf: boolean) {
		console.log(data, isSelf);
	}
	function onNodeDblclick() {
		console.log('onNodeDblclick')
	}
	function onNodeClick(e: Event, data: Node) {
		ElMessage.info(data.deptName);
	}
	function expandChange() {
		toggleExpand(data, expandAll.value);
	}
	function toggleExpand(data: Node[] | Node, val: boolean) {
		if (Array.isArray(data)) {
			data.forEach((item) => {
				item.expand = val;
				if (item.children) {
					toggleExpand(item.children, val);
				}
			});
		}
		else {
			data.expand = val;
			if (data.children) {
				toggleExpand(data.children, val);
			}
		}
	}
</script>

<!-- @import 'vue3-tree-org/lib/vue3-tree-org.css'; -->
<style scoped lang="scss">
	@import url('./index.scss');
</style>


	