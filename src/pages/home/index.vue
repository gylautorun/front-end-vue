<template>
	<a-card title="工作台" :bordered="false" :bodyStyle="{ padding: '15px' }" class="mb-6">
		<a-row>
			<a-col :span="12">
				<div class="flx-align-center">
					<a-avatar :size="{ md: 42, xl: 52, xxl: 64 }">
						<template #icon>
							<img alt="avatar" src="@/assets/images/avatar.jpg" />
						</template>
					</a-avatar>
					<div>
						<p class="px-16 text-title">
							<span>{{ time }}</span
							>，{{ username }}，开始您一天的工作吧！
						</p>
						<p class="px-16 text-gray">今日阴转大雨，17℃ - 28℃，出门记得带伞哦。</p>
					</div>
				</div>
			</a-col>
			<a-col :span="12" class="flx-justify-between">
				<a-card :bordered="false" :bodyStyle="{ padding: '6px' }">
					<p class="count-text">项目数</p>
					<a-typography-text strong class="info-size">
						<CountUp :end="1600" :options="{ prefix: '' }"></CountUp>
					</a-typography-text>
				</a-card>
				<a-card :bordered="false" :bodyStyle="{ padding: '6px' }">
					<p class="count-text">待办</p>
					<a-typography-text strong class="info-size">
						<CountUp :end="9" :options="{ prefix: '' }"></CountUp>/<CountUp :end="16" :options="{ prefix: '' }"></CountUp>
					</a-typography-text>
				</a-card>
				<a-card :bordered="false" :bodyStyle="{ padding: '6px' }">
					<p class="count-text">消息</p>
					<a-typography-text strong class="info-size">
						<CountUp :end="1136" :options="{ prefix: '' }"></CountUp>
					</a-typography-text>
				</a-card>
			</a-col>
		</a-row>
	</a-card>
	<a-row :gutter="6">
		<!-- 工程项目 -->
		<a-col :span="12">
			<a-card title="工程项目" class="mb-6">
				<template #extra><a href="https://github.com/amoursun?tab=repositories" target="_blank">更多项目</a></template>
				<a-card-grid v-for="item in projectData" :key="item.title">
					<div class="flex flex-row">
						<component :is="item.icon" :style="{ fontSize: '30px', color: item.color }"></component>
						<span class="project-text">
							<a-anchor-link :href="item.link" :title="item.title" target="_blank" />
						</span>
					</div>
					<div class="flex mt-8 text-gray" style="height: 40px; overflow: hidden">{{ item.desc }}</div>
					<div class="flex mt-8 text-gray" style="height: 20px; overflow: hidden; font-size: 12px; color: rgb(0 0 0 / 25%)">
						{{ item.author }}
					</div>
				</a-card-grid>
			</a-card>
			<!-- 动态 -->
			<a-card
				class="dynamic-data"
				title="动态"
				:bordered="false"
				:bodyStyle="{ padding: 0, overflowY: 'auto', height: '520px' }"
			>
				<a-list item-layout="horizontal" :data-source="dynamicData">
					<template #renderItem="{ item }">
						<a-list-item>
							<a-list-item-meta :description="item.desc">
								<template #title>
									<a :href="item.link" target="_blank">{{ item.title }}</a>
								</template>
								<template #avatar>
									<a-avatar :size="40">
										<template #icon>
											<img alt="avatar" src="@/assets/images/avatar.jpg" />
										</template>
									</a-avatar>
								</template>
							</a-list-item-meta>
						</a-list-item>
					</template>
				</a-list>
			</a-card>
		</a-col>
		<!-- 快捷操作 -->
		<a-col :span="12">
			<a-card title="快捷操作" class="mb-6">
				<a-card-grid
					style="padding: 12px; text-align: center"
					v-for="item in shortcutKeyList"
					:key="item.title"
					class="shortcut-key"
				>
					<div class="flex justify-center flex-col" @click="item.onClick">
						<span>
							<component :is="item.icon" :style="{ fontSize: '26px', color: item.color }"></component>
						</span>
						<span class="title">{{ item.title }}</span>
					</div>
				</a-card-grid>
			</a-card>
			<!-- Gitee / GitHub 访问量占比 -->
			<a-card title="Gitee / GitHub 访问量占比" :bodyStyle="{ height: '350px' }">
				<div class="book-echarts">
					<Pie ref="pieRef" />
				</div>
			</a-card>
			<a-card title="Gitee / GitHub 访问量占比" :bodyStyle="{ height: '350px' }">
				<Counter />
			</a-card>
			
		</a-col>
	</a-row>
</template>

<script setup lang="ts" name="home">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/modules/user';
import { getTimeState } from '@/utils/util';
import { useRouter } from 'vue-router';
import CountUp from '@/components/count-up/index.vue';
import Pie from './pie.vue';
import Counter from './counter.vue';

interface DataItem {
	id: string;
	title: string;
	link: string;
	desc: string;
}

interface ShortcutKeyItem {
	icon: string;
	title: string;
	color: string;
	onClick: () => void;
}

interface ShortcutKeyItem {
	icon: string;
	title: string;
	color: string;
	onClick: () => void;
}

interface ProjectItem {
	icon: string;
	title: string;
	desc: string;
	author: string;
	color: string;
	link?: string;
}

const router = useRouter();
const userStore = useUserStore();
const username = computed(() => userStore.userInfo.name);
const time = computed(() => getTimeState());
const pieRef = ref();

/* 快捷键 */
const shortcutKeyList: ShortcutKeyItem[] = [
	{
		icon: 'FundViewOutlined',
		title: '主控台',
		color: '#68c755',
		onClick: () => {
			router.push('/dashboard');
		}
	},
	{
		icon: 'FileTextOutlined',
		title: '表单',
		color: '#fab558',
		onClick: () => {
			router.push('/form/basic-form');
		}
	},
	{
		icon: 'LockOutlined',
		title: '权限管理',
		color: '#3da2ff',
		onClick: () => {
			router.push('/auth/menu');
		}
	},
	{
		icon: 'BarChartOutlined',
		title: '数据大屏',
		color: '#f387aa',
		onClick: () => {
			router.push('/data-screen');
		}
	},
	{
		icon: 'ProjectOutlined',
		title: '关于项目',
		color: '#814dd6',
		onClick: () => {
			router.push('/about/index');
		}
	},
	{
		icon: 'MailOutlined',
		title: '消息',
		color: '#5cdbd3',
		onClick: () => {
			// router.push('/message');
		}
	}
];

const articleList = [
	{
		'index': '0',
		'title': '半小时也不一定能学会智能防挡弹幕',
		'link': 'https://juejin.cn/post/7365723860999913508'
	},
	{
		'index': '1',
		'title': '一文帮你熟悉 React17 事件机制 (一)',
		'link': 'https://juejin.cn/post/7361358666212687881'
	},
	{
		'index': '2',
		'title': '一文帮你熟悉 React17 事件机制 (二)',
		'link': 'https://juejin.cn/post/7361323894449766438'
	},
	{
		'index': '3',
		'title': 'css filter 滤镜效果与特效',
		'link': 'https://juejin.cn/post/7266778221671809063'
	},
	{
		'index': '4',
		'title': '用装饰器来优化前端权限控制',
		'link': 'https://juejin.cn/post/7258970835045646392'
	},
	{
		'index': '5',
		'title': '浅析 JavaScript 类型化数组',
		'link': 'https://juejin.cn/post/7256565518584332348'
	},
	{
		'index': '6',
		'title': '深度工作 DEEP WORK',
		'link': 'https://juejin.cn/post/7233284282965393463'
	},
	{
		'index': '7',
		'title': '从0到1搭建一个 React 项目开发模板',
		'link': 'https://juejin.cn/post/7230746572551487548'
	},
	{
		'index': '8',
		'title': 'JS实现鼠标漫游',
		'link': 'https://juejin.cn/post/7229178686431805498'
	},
	{
		'index': '9',
		'title': '浅探 Mobx 的函数式响应编程',
		'link': 'https://juejin.cn/post/7225056158981128251'
	},
	{
		'index': '10',
		'title': '以纯前端视野如何快速上手 Flutter',
		'link': 'https://juejin.cn/post/7215115493857738810'
	},
	{
		'index': '11',
		'title': 'React Hooks 原理探究',
		'link': 'https://juejin.cn/post/7212436135287767098'
	},
	{
		'index': '12',
		'title': 'React Hooks 实践',
		'link': 'https://juejin.cn/post/7209839519863750711'
	},
	{
		'index': '13',
		'title': 'css 如何实现样式隔离？',
		'link': 'https://juejin.cn/post/7207239167083135032'
	},
	{
		'index': '14',
		'title': '前端怎么处理文件',
		'link': 'https://juejin.cn/post/7181282391737466937'
	},
	{
		'index': '15',
		'title': '浅谈明暗水印',
		'link': 'https://juejin.cn/post/7178674529219117113'
	},
	{
		'index': '16',
		'title': '10分钟带你了解什么是ArrayBuffer？',
		'link': 'https://juejin.cn/post/7176079047699464253'
	},
	{
		'index': '17',
		'title': 'Vite项目启动都做了什么？',
		'link': 'https://juejin.cn/post/7173468039789150222'
	},
	{
		'index': '18',
		'title': 'react 应用中的模块热更新',
		'link': 'https://juejin.cn/post/7168271366519521316'
	},
	{
		'index': '19',
		'title': 'Git bisect 命令解析 #5 : bisect 的算法解析',
		'link': 'https://juejin.cn/post/7166066196150910984'
	},
	{
		'index': '20',
		'title': '你可能还不知道的CSS好用属性：clip-path',
		'link': 'https://juejin.cn/post/7163075335058096141'
	},
	{
		'index': '21',
		'title': '不一样的边框：border-radius和border-image',
		'link': 'https://juejin.cn/post/7160498681182388254'
	},
	{
		'index': '22',
		'title': '一次性弄懂Unicode和UTF-8',
		'link': 'https://juejin.cn/post/7152699935660441636'
	},
	{
		'index': '23',
		'title': '聊聊代理服务器的那些事',
		'link': 'https://juejin.cn/post/7147506835594543118'
	},
	{
		'index': '24',
		'title': 'React SSR 原理解析和实践',
		'link': 'https://juejin.cn/post/7144905013016395783'
	},
	{
		'index': '25',
		'title': '一文彻底学会使用web worker',
		'link': 'https://juejin.cn/post/7139718200177983524'
	},
	{
		'index': '26',
		'title': '从源码角度看，React 在 setState 的时候做了什么？',
		'link': 'https://juejin.cn/post/7137119416721866789'
	},
	{
		'index': '27',
		'title': 'Electron 窗口池优化方案实践',
		'link': 'https://juejin.cn/post/7134519311003025438'
	},
	{
		'index': '28',
		'title': '或许我们并不需要 default exports',
		'link': 'https://juejin.cn/post/7131936594486886413'
	},
	{
		'index': '29',
		'title': '当我们在谈微前端的时候，我们在谈什么？',
		'link': 'https://juejin.cn/post/7129316782929608717'
	},
	{
		'index': '30',
		'title': 'React 事件机制解析',
		'link': 'https://juejin.cn/post/7126733601533591582'
	},
	{
		'index': '31',
		'title': 'Git bisect 命令解析 #4 : 应用过程中的一些扩展问题',
		'link': 'https://juejin.cn/post/7124137321657532429'
	},
	{
		'index': '32',
		'title': '2022年了，你还没用pnpm吗？',
		'link': 'https://juejin.cn/post/7121386382936768542'
	},
	{
		'index': '33',
		'title': '基于 React Context 实现一个简单的状态管理',
		'link': 'https://juejin.cn/post/7118946120499200031'
	},
	{
		'index': '34',
		'title': 'Git bisect 命令解析 #3 : 案例 3 之 \'回退型合并提交\' 的分析和处理',
		'link': 'https://juejin.cn/post/7116344403479756808'
	},
	{
		'index': '35',
		'title': 'JS实现时间轴动画',
		'link': 'https://juejin.cn/post/7113745092120150046'
	},
	{
		'index': '36',
		'title': '写一个烟花送给自己吧',
		'link': 'https://juejin.cn/post/7111155407636135972'
	},
	{
		'index': '37',
		'title': '基于webcomponents实现一个微前端框架（上）',
		'link': 'https://juejin.cn/post/7108915983766519839'
	},
	{
		'index': '38',
		'title': '从源码角度看，Webpack-Dev-Server 做了哪些事？',
		'link': 'https://juejin.cn/post/7106008968618573861'
	},
	{
		'index': '39',
		'title': '2022年你不知道的CSS新特性',
		'link': 'https://juejin.cn/post/7103409377821851662'
	},
	{
		'index': '40',
		'title': '从接口定义自动生成前端代码',
		'link': 'https://juejin.cn/post/7101125603637592078'
	},
	{
		'index': '41',
		'title': 'Javascript中的栈和队列',
		'link': 'https://juejin.cn/post/7098133664789168159'
	},
	{
		'index': '42',
		'title': 'Electron 如何使用 IPC 命名管道与其他应用通信',
		'link': 'https://juejin.cn/post/7095629157194792997'
	},
	{
		'index': '43',
		'title': 'Git bisect 命令解析 #2 : 案例 2 之 \'含合并提交\' 的分析和处理',
		'link': 'https://juejin.cn/post/7094144719667593224'
	},
	{
		'index': '44',
		'title': 'AST 数据结构与 babel',
		'link': 'https://juejin.cn/post/7090396145230282783'
	},
	{
		'index': '45',
		'title': '30分钟搞懂 HTTP 缓存',
		'link': 'https://juejin.cn/post/7087759660391858183'
	},
	{
		'index': '46',
		'title': '如何优雅地创建嵌套对象并传递初值?',
		'link': 'https://juejin.cn/post/7085164383021563911'
	},
	{
		'index': '47',
		'title': 'React useEffect 两个参数你用对了吗',
		'link': 'https://juejin.cn/post/7083308347331444750'
	},
	{
		'index': '48',
		'title': 'Git bisect 命令解析 #1 : 基础介绍 & 案例 1 之 \'线性提交\'',
		'link': 'https://juejin.cn/post/7079974974949179406'
	},
	{
		'index': '49',
		'title': '从快速幂到矩阵快速幂',
		'link': 'https://juejin.cn/post/7077382565916573704'
	},
	{
		'index': '50',
		'title': '前端工程师如何在轻松的工作中，\'优雅\'地气死leader',
		'link': 'https://juejin.cn/post/7074784476429025294'
	},
	{
		'index': '51',
		'title': 'webpack的模块化处理（二）',
		'link': 'https://juejin.cn/post/7072542295144267812'
	},
	{
		'index': '52',
		'title': 'webpack的模块化处理（一）',
		'link': 'https://juejin.cn/post/7069738874804633630'
	},
	{
		'index': '53',
		'title': '那些有关于Loader的知识',
		'link': 'https://juejin.cn/post/7067365489646764040'
	},
	{
		'index': '54',
		'title': '二维码系列 -- 二维码原理(二)',
		'link': 'https://juejin.cn/post/7052945234354765831'
	},
	{
		'index': '55',
		'title': '二维码系列 -- 常见的\'码\'(一)',
		'link': 'https://juejin.cn/post/7052945153190952997'
	},
	{
		'index': '56',
		'title': 'Linux中的Link及Node中几种常见的软链接应用',
		'link': 'https://juejin.cn/post/7052944419728654349'
	},
	{
		'index': '57',
		'title': 'Alpha混色模式合成算法',
		'link': 'https://juejin.cn/post/7052904883187351583'
	}
];
/* 动态 */
const dynamicData: DataItem[] = [
	{
		id: '1',
		title: 'vue3自定义右键菜单组件',
		link: 'https://juejin.cn/post/7212456518331088952',
		desc: '2023-05-06 22:06:16'
	},
	{
		id: '2',
		title: '工程化之Axios + Ts的二次封装',
		link: 'https://juejin.cn/post/7175174061515866149',
		desc: '2023-05-04 12:17:16'
	},
	{
		id: '3',
		title: 'less 定义全局样式',
		link: 'https://juejin.cn/post/7167007858394546213',
		desc: '2023-05-03 21:37:16'
	},
	{
		id: '4',
		title: 'vue3.2 - nextTick的使用',
		link: 'https://juejin.cn/post/7039135899904393229',
		desc: '2023-05-02 15:27:16'
	},
	{
		id: '5',
		title: 'Vue版的 hooks 库 --- VueUse',
		link: 'https://juejin.cn/post/7055248384713555999',
		desc: '2023-05-01 05:30:16'
	},
	{
		id: '6',
		title: 'Vue3自定义指令-10个常见的实用指令',
		link: 'https://juejin.cn/post/6968996649515515917',
		desc: '2023-05-01 16:17:16'
	},
	{
		id: '7',
		title: '那些有关于Loader的知识',
		link: 'https://juejin.cn/post/7067365489646764040',
		desc: '2023-05-06 22:06:16'
	},
	{
		id: '8',
		title: '半小时也不一定能学会智能防挡弹幕',
		link: 'https://juejin.cn/post/7365723860999913508',
		desc: '2023-05-04 12:17:16'
	},
].concat(articleList.map((it, index) => ({
	id: `${it.index}-${index}`,
	title: it.title,
	link: it.link,
	desc: '2023-05-06 22:06:16'
})));

console.log(dynamicData, dynamicData)

/* 工程项目 */
const projectData: ProjectItem[] = [
	{
		icon: 'GithubOutlined',
		title: 'Github',
		desc: '是一个面向开源及私有软件项目的托管平台。',
		author: '开源君 2021-07-04',
		color: '#333639',
		link: 'https://github.com/amoursun'
	},
	{
		icon: 'GitlabOutlined',
		title: 'Gitlab',
		desc: '基于git的项目管理软件。',
		author: '学不动也要学 2021-07-04',
		color: '#47ba86',
		link: 'https://gitlab.com/users/sign_in'
	},
	{
		icon: 'Html5Outlined',
		title: 'HTML5',
		desc: 'HTML5是互联网的下一代标准。',
		author: '撸码也是一种艺术 2021-04-01',
		color: '#e4502c',
		link: 'https://www.w3school.com.cn/html/html5_intro.asp'
	},
	{
		icon: 'TaobaoCircleOutlined',
		title: '淘宝网',
		desc: '只有你想不到，没有你淘不到。',
		author: '购物天地 2021-04-01',
		color: '#42b983',
		link: 'https://www.taobao.com/'
	},
	{
		icon: 'AlipayCircleOutlined',
		title: '支付宝',
		desc: '致力于为企业和个人提供，简单、安全、快速、支付解决方案。',
		author: '支付工具 2021-07-04',
		color: '#61dafb',
		link: 'https://auth.alipay.com/login/index.htm'
	},
	{
		icon: 'WeiboOutlined',
		title: '微博',
		desc: '分享简短实时信息的社交平台。',
		author: '分享君 2021-07-04',
		color: '#dd0031',
		link: 'https://weibo.com/newlogin?url=https%3A%2F%2Fweibo.com%2F'
	}
];

const pieData = [
	{ value: 4524, name: 'Gitee 访问量' },
	{ value: 8616, name: 'GitHub 访问量' }
];

onMounted(() => {
	pieRef.value.initChart(pieData);
});
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
