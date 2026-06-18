<template>
    <div class="event-history-panel" :class="{ 'is-collapsed': isCollapsed }">
        <!-- 展开/收起按钮 -->
        <div class="panel-header" @click="togglePanel">
            <span class="panel-title">📋 操作历史</span>
            <span class="event-count" v-if="!isCollapsed">({{ eventCount }} 条)</span>
            <span class="collapse-icon">{{ isCollapsed ? '▶' : '◀' }}</span>
        </div>

        <!-- 事件列表 -->
        <div v-if="!isCollapsed" class="panel-body">
            <!-- 操作按钮 -->
            <div class="panel-actions">
                <button @click="clearEvents" class="btn-clear">清空</button>
                <button @click="exportEvents" class="btn-export">导出</button>
            </div>

            <!-- 事件表格 -->
            <a-table
                :dataSource="displayedEvents"
                :columns="columns"
                :pagination="false"
                :scroll="{ y: 300 }"
                size="small"
                rowKey="timestamp"
                class="event-table"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'time'">
                        <span class="event-time">{{ record.timeString }}</span>
                    </template>
                    <template v-else-if="column.key === 'type'">
                        <a-tag :color="getEventTypeColor(record.type)">
                            {{ formatEventType(record.type) }}
                        </a-tag>
                    </template>
                    <template v-else-if="column.key === 'data'">
                        <span class="event-data" :title="formatEventData(record)">{{
                            formatEventData(record)
                        }}</span>
                    </template>
                </template>
            </a-table>

            <!-- 查看更多 -->
            <div v-if="eventCount > maxDisplayCount" class="show-more">
                <button @click="toggleShowAll">
                    {{ showAll ? '收起' : `还有 ${eventCount - maxDisplayCount} 条记录...` }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import { EventLogger, type EventLogEntry } from '../utils/EventLogger';

interface Props {
    /** 事件记录器实例 */
    eventLogger: EventLogger;
    /** 最大显示数量（默认 100） */
    maxDisplayCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
    maxDisplayCount: 100
});

/** 面板是否收起 */
const isCollapsed = ref(false);

/** 是否显示全部事件 */
const showAll = ref(false);

/** 响应式事件列表 */
const events = ref<EventLogEntry[]>([]);

/** 取消订阅函数 */
let unsubscribe: (() => void) | null = null;

/** 事件数量 */
const eventCount = computed(() => events.value.length);

/** 显示的事件列表 */
const displayedEvents = computed(() => {
    if (showAll.value || events.value.length <= props.maxDisplayCount) {
        return [...events.value].reverse(); // 最新的在前
    }
    return events.value.slice(-props.maxDisplayCount).reverse();
});

/** 表格列定义 */
const columns = [
    {
        title: '时间',
        key: 'time',
        width: 140,
        fixed: 'left' as const
    },
    {
        title: '操作类型',
        key: 'type',
        width: 100
    },
    {
        title: '详情',
        key: 'data',
        ellipsis: true
    }
];

/** 初始化订阅 */
onMounted(() => {
    // 初始加载现有事件
    events.value = props.eventLogger.getEvents();

    // 订阅事件变化
    unsubscribe = props.eventLogger.subscribe((newEvents) => {
        events.value = newEvents;
    });
});

/** 清理订阅 */
onUnmounted(() => {
    if (unsubscribe) {
        unsubscribe();
    }
});

/** 切换面板展开/收起 */
function togglePanel() {
    isCollapsed.value = !isCollapsed.value;
}

/** 切换显示全部 */
function toggleShowAll() {
    showAll.value = !showAll.value;
}

/** 清空事件记录 */
function clearEvents() {
    props.eventLogger.clear();
}

/** 导出事件记录 */
function exportEvents() {
    const json = props.eventLogger.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event-history-${dayjs().valueOf()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

/** 格式化事件类型 */
function formatEventType(type: string): string {
    const typeMap: Record<string, string> = {
        'node:click': '点击节点',
        'node:dblclick': '双击节点',
        'node:more': '更多操作',
        'node:expand': '展开',
        'node:collapse': '收起',
        'node:drop-target': '拖拽节点',
        'node:select': '选中节点',
        'node:select-multi': '多选节点',
        'node:deselect': '取消选中',
        'node:add': '新增节点',
        'node:delete': '删除节点',
        'node:edit': '编辑节点',
        'node:integrate': '整合节点',
        'node:bind-relation': '绑定关系',
        'node:integration': '标注整合',
        'module:add': '新增模块',
        'tree:reset': '重置树',
        'history:change': '历史变化',
        'history:undo': '撤销',
        'history:redo': '重做',
        'zoom:in': '放大',
        'zoom:out': '缩小',
        'zoom:reset': '重置缩放',
        'zoom:fit': '适应视图',
        'layout:toggle': '切换布局',
        'orientation:change': '方向变化',
        refresh: '刷新',
        download: '下载图片'
    };
    return typeMap[type] || type;
}

/** 获取事件类型的颜色 */
function getEventTypeColor(type: string): string {
    if (type.startsWith('node:')) return 'blue';
    if (type.startsWith('history:')) return 'orange';
    if (type.startsWith('zoom:')) return 'green';
    if (type.startsWith('layout:')) return 'purple';
    if (type === 'download') return 'cyan';
    if (type === 'refresh') return 'magenta';
    return 'default';
}

/** 格式化事件数据 */
function formatEventData(event: EventLogEntry): string {
    const data = event.data;
    if (!data || Object.keys(data).length === 0) {
        return '-';
    }

    // 节点相关事件（同时有名称、ID和操作类型）
    if ('label' in data && 'nodeId' in data && 'action' in data) {
        return `${data.action}~节点名称:${data.label}, 节点id:${data.nodeId}`;
    }
    if ('label' in data && 'nodeId' in data) {
        return `节点名称:${data.label}, 节点id:${data.nodeId}`;
    }
    if ('label' in data && 'id' in data) {
        return `节点名称:${data.label}, 节点id:${data.id}`;
    }
    if ('nodeId' in data) {
        return `节点ID:${data.nodeId}`;
    }
    if ('sourceLabel' in data && 'targetLabel' in data) {
        return `${data.sourceLabel} → ${data.targetLabel}`;
    }
    if ('orientation' in data) {
        return data.orientation === 'horizontal' ? '左右布局' : '上下布局';
    }
    if ('filename' in data) {
        return `文件: ${data.filename}`;
    }
    if ('format' in data) {
        return `格式: ${data.format}`;
    }
    if ('canUndo' in data) {
        return data.canUndo ? '可撤销' : '不可撤销';
    }
    if ('k' in data) {
        return `缩放 ${Math.round(data.k * 100)}%`;
    }

    return JSON.stringify(data).slice(0, 50);
}
</script>

<style lang="scss" scoped>
.event-history-panel {
    position: fixed;
    // top: 80px;
    // left: 20px;
    top: 0;
    left: 0;
    width: 450px;
    max-height: 500px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;

    &.is-collapsed {
        width: 160px;
        max-height: none;

        .panel-header {
            border-radius: 8px;
        }
    }
}

.panel-header {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    user-select: none;

    &:hover {
        background: #e9ecef;
    }

    .panel-title {
        font-size: 13px;
        font-weight: 600;
        color: #333;
    }

    .event-count {
        flex: 1;
        margin-left: 8px;
        font-size: 12px;
        color: #666;
    }

    .collapse-icon {
        font-size: 10px;
        color: #999;
    }
}

.panel-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.panel-actions {
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid #e9ecef;

    button {
        flex: 1;
        padding: 4px 8px;
        font-size: 12px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        background: #fff;
        cursor: pointer;

        &:hover {
            color: #1890ff;
            border-color: #1890ff;
        }
    }

    .btn-clear {
        &:hover {
            color: #ff4d4f;
            border-color: #ff4d4f;
        }
    }
}

.event-table {
    :deep(.ant-table) {
        font-size: 12px;
    }

    :deep(.ant-table-thead > tr > th) {
        background: #fafafa;
        font-weight: 600;
        padding: 8px 12px;
    }

    :deep(.ant-table-tbody > tr > td) {
        padding: 6px 12px;
    }

    .event-time {
        font-family: monospace;
        font-size: 11px;
        color: #666;
    }

    .event-data {
        color: #333;
    }
}

.show-more {
    padding: 8px 12px;
    border-top: 1px solid #e9ecef;

    button {
        width: 100%;
        padding: 4px;
        font-size: 12px;
        color: #1890ff;
        background: none;
        border: none;
        cursor: pointer;

        &:hover {
            text-decoration: underline;
        }
    }
}
</style>
