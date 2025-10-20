<template>
	<div class="container">
		<el-row justify="center">
			<!-- 搜索栏start -->
			<div class="search">
				<el-input
					v-model="searchVal"
					clearable
					input-style="border:none;"
					ref="inputRef"
					@keyup.enter="gotoSearch"
				>
					<template #prepend>
						<el-select
							v-model="searchEngine"
							style="width: 90px"
							size="large"
							@change="searchEngineChange"
						>
							<el-option
								:label="item.name"
								:value="index"
								v-for="(item, index) of searchEngines"
							/>
						</el-select>
					</template>
					<template #append>
						<el-button type="primary" @click="gotoSearch">搜索</el-button>
					</template>
				</el-input>
				<el-tag
					size="large"
					style="margin-left: 8px; color: #fafafa; cursor: pointer"
					@click="showHightSearch"
					color="#b1b19e"
					disable-transitions
				>
					高级
				</el-tag>
			</div>
			<!-- 内容start -->
			<div class="jianjie">
				<div class="jj-list" v-for="item of navigationList">
					<div class="jj-list-tit">{{ item.category }}</div>
					<ul class="jj-list-con">
					<li v-for="item1 of item.children">
						<a
							:href="item1.link"
							class="link-3"
							rel="nofollow"
							target="_blank"
							@click="jumpA(item1.link, $event)"
						>
							{{item1.title}}
						</a>
					</li>
					</ul>
				</div>
			</div>
		
			<el-dialog
				v-model="dialogShow"
				title="高级搜索"
				:show-close="false"
				:close-on-click-modal="false"
				@close="dialogClose"
			>
				<el-form>
					<el-form-item label="来源: ">
						<el-space :size="1">
							<el-checkbox
								v-model="checkAllIncludes"
								:indeterminate="isIndeterminateIncludes"
								@change="handleCheckAllIncludesChange"
							>
								全选
							</el-checkbox>
						</el-space>
						<el-checkbox-group
							v-model="checkedIncludes"
							@change="handleCheckedIncludesChange"
						>
							<el-checkbox
							v-for="item in includes"
							:key="item.link"
							:label="item.link"
							>{{item.title}}</el-checkbox
							>
						</el-checkbox-group>
					</el-form-item>
					<el-form-item label="排除: ">
						<el-space :size="1">
							<el-checkbox
								v-model="checkAllExcludes"
								:indeterminate="isIndeterminateExcludes"
								@change="handleCheckAllExcludesChange"
							>
								全选
							</el-checkbox>
						</el-space>
						<el-checkbox-group
							v-model="checkedExcludes"
							@change="handleCheckedExcludesChange"
						>
							<el-checkbox
								v-for="item in excludes"
								:key="item.link"
								:label="item.link"
							>
								{{item.title}}
							</el-checkbox>
						</el-checkbox-group>
					</el-form-item>
					<el-form-item class="once-search">
						<el-button type="primary" plain @click="onceSearch">仅本次搜索</el-button>
					</el-form-item>
				</el-form>
				<template #footer>
					<span class="dialog-footer">
					<el-button @click="dialogShow = false">取消</el-button>
					<el-button type="primary" @click="saveStorage">保存</el-button>
					</span>
				</template>
			</el-dialog>
		</el-row>
	</div>
</template>

<script setup lang="ts" name="nav">
	import { ref, computed, onMounted, onUnmounted} from 'vue';
	import { useRouter } from 'vue-router';
	import { storageHandler } from './tool';
	import {
		ElButton,
		ElRow,
		ElCol,
		ElOption,
		ElSelect,
		ElInput,
		ElTag,
		ElCheckbox,
		ElSpace,
		ElCheckboxGroup,
		ElFormItem,
		ElForm,
		ElDialog,
		CheckboxValueType,
	} from 'element-plus';

	import {navigationUrls, searchEngines, includes, excludes} from './constant';

	const router = useRouter();
	const searchKey = 'SEARCH_KEY';
	const searchEngineDefault = 'SEARCH_ENGINE_DEFAULT';
	const searchVal = ref<string>('');
	const searchEngine = ref<number>(1);
	const searchRules = ref<string>('');
	const dialogShow = ref<boolean>(false);
	const inputRef = ref<HTMLInputElement | null>(null);
	const includesTemp: string[] = includes.map((item) => item.link);
	const checkAllIncludes = ref<boolean>(false);
	const isIndeterminateIncludes = ref<boolean>(false);
	const checkedIncludes = ref<string[]>([]);

	const reset = (flag?: '0' | '1') => {
		if (flag !== '0') {
			checkedIncludes.value = [];
			checkAllIncludes.value = false;
			isIndeterminateIncludes.value = false;
		}

		if (flag !== '1') {
			checkedExcludes.value = [];
			checkAllExcludes.value = false;
			isIndeterminateExcludes.value = false;
		}
	};

	const handleCheckAllIncludesChange = (val: CheckboxValueType) => {
		reset('0');
		checkedIncludes.value = val ? includesTemp : [];
		isIndeterminateIncludes.value = false;
	};
	const handleCheckedIncludesChange = (value: CheckboxValueType[]) => {
		reset('0');
		const checkedCount = value.length;
		checkAllIncludes.value = checkedCount === includes.length;
		isIndeterminateIncludes.value = checkedCount > 0 && checkedCount < includes.length;
	};

	const excludesTemp = excludes.map((item) => item.link);
	const checkAllExcludes = ref(false);
	const isIndeterminateExcludes = ref(false);
	const checkedExcludes = ref<string[]>([]);

	const handleCheckAllExcludesChange = (val: CheckboxValueType) => {
		reset('1');
		checkedExcludes.value = val ? excludesTemp : [];
		isIndeterminateExcludes.value = false;
	};
	const handleCheckedExcludesChange = (value: CheckboxValueType[]) => {
		reset('1');
		const checkedCount = value.length;
		checkAllExcludes.value = checkedCount === excludes.length;
		isIndeterminateExcludes.value = checkedCount > 0 && checkedCount < excludes.length;
	};
	const jumpA = (link: string, e: Event) => {
		if (link === '#') {
			e.preventDefault();
		}
		else if (link.startsWith('/')) {
			router.push({path: link});
			e.preventDefault();
		}
		else if (link.startsWith('http')) {
			window.open(link);
			e.preventDefault();
		}
	};

	const showHightSearch = () => {
		dialogShow.value = true;
	};
	const onceSearch = () => {
		gotoSearch();
	};
	const gotoSearch = () => {
		if (!searchVal.value) return;
		const { link, key } = searchEngines[searchEngine.value];
		searchHandler();
		const url = `${link}?${key}=${searchVal.value}${searchRules.value}`;
		window.open(url);
	};
	const searchHandler = () => {
		searchRules.value = '';
		checkedIncludes.value.forEach((item, index) => {
			const key = index === 0 ? ' ' : ' | ';
			searchRules.value += key + 'site:' + item;
		});
		checkedExcludes.value.forEach((item, index) => {
			const key = ' ';
			searchRules.value += key + '-site:' + item;
		});
	};
	const navigationList = computed(() => {
		// 模拟数据
		const result = navigationUrls;
		result.forEach((item) => {
			const temp = Array.from(Array(9), () => {
				return {
					title: '---',
					link: '#',
				};
			});
			item.children.forEach((item1, index1) => {
				temp[index1] = item1;
			});
			item.children = temp;
		});
		return result;
	});

	const dialogClose = () => {
		init();
	};

	const saveStorage = () => {
		let temp = null;
		const len1 = checkedIncludes.value.length;
		const len2 = checkedExcludes.value.length;
		if (!len1 && !len2) {
			reset();
			localStorage.removeItem(searchKey);
		}
		if (len1) {
			temp = {
				index: '0',
				checkedList: checkedIncludes.value,
			};
		}
		if (len2) {
			temp = {
				index: '1',
				checkedList: checkedExcludes.value,
			};
		}
		if (temp) {
			storageHandler(searchKey, JSON.stringify(temp));
		}
		dialogShow.value = false;
	};
	const searchEngineChange = () => {
		storageHandler(searchEngineDefault, searchEngine.value);
	};
	const init = () => {
		const storage = storageHandler(searchKey);
		const searchEngineDefaultTemp = storageHandler(searchEngineDefault);
		reset();
		if (storage) {
			if (storage.index === '0') {
				const checkedCount = storage.checkedList.length;
				checkedIncludes.value = storage.checkedList;
				checkAllIncludes.value = checkedCount === includes.length;
				isIndeterminateIncludes.value = checkedCount > 0 && checkedCount < includes.length;
			}
			if (storage.index === '1') {
				const checkedCount = storage.checkedList.length;
				checkedExcludes.value = storage.checkedList;
				checkAllExcludes.value = checkedCount === excludes.length;
				isIndeterminateExcludes.value = checkedCount > 0 && checkedCount < excludes.length;
			}
		}

		if (searchEngineDefaultTemp) {
			searchEngine.value = Number(searchEngineDefaultTemp);
		}
	};
	function listenerInit() {
		window.addEventListener('keydown', (e) => {
			if (e.key === '/' && inputRef.value !== document.activeElement) {
				inputRef.value?.focus();
				e.preventDefault();
			}
			if (e.ctrlKey && e.key === '/') {
				searchVal.value = '';
				if (inputRef.value !== document.activeElement) {
					inputRef.value?.focus();
				}
				e.preventDefault();
			}
		});
	}
	onMounted(() => {
		init();
		listenerInit();
	});
</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>
