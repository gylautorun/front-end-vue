<template>
    <div class="floating-controller-demo">
        <div class="demo-header">
            <h1>🎯 全局悬浮布局控制器</h1>
            <p>右下角的悬浮小球可以控制整个页面的布局显示</p>
        </div>

        <div class="demo-content">
            <div class="feature-card">
                <h3>✨ 主要特性</h3>
                <ul>
                    <li>🎨 <strong>美观设计</strong> - 渐变小球 + 动画效果</li>
                    <li>⚡ <strong>快速操作</strong> - 一键切换布局组件</li>
                    <li>📱 <strong>响应式</strong> - 适配桌面和移动端</li>
                    <li>🔄 <strong>实时反馈</strong> - 显示当前布局状态</li>
                    <li>🎯 <strong>全局可用</strong> - 所有页面都能使用</li>
                </ul>
            </div>

            <div class="feature-card">
                <h3>🎮 控制选项</h3>
                <div class="control-grid">
                    <div class="control-item">
                        <h4>单独控制</h4>
                        <p>切换侧边栏、顶部导航、底部信息</p>
                    </div>
                    <div class="control-item">
                        <h4>预设模式</h4>
                        <p>全屏、无侧边栏、标准等模式</p>
                    </div>
                    <div class="control-item">
                        <h4>快捷操作</h4>
                        <p>切换全部、隐藏全部、显示全部</p>
                    </div>
                </div>
            </div>

            <div class="feature-card">
                <h3>🚀 使用方法</h3>
                <ol>
                    <li>点击右下角的悬浮小球</li>
                    <li>在弹出的控制面板中选择操作</li>
                    <li>布局会立即响应你的操作</li>
                    <li>点击外部区域关闭面板</li>
                </ol>
            </div>

            <div class="feature-card">
                <h3>💡 使用场景</h3>
                <div class="scenario-grid">
                    <div class="scenario-item">
                        <h4>🛠️ 开发调试</h4>
                        <p>快速测试不同布局效果，验证响应式设计</p>
                    </div>
                    <div class="scenario-item">
                        <h4>👤 用户体验</h4>
                        <p>让用户自定义界面布局，提供个性化设置</p>
                    </div>
                    <div class="scenario-item">
                        <h4>🎪 演示展示</h4>
                        <p>展示布局控制功能，突出系统灵活性</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="demo-footer">
            <p>💡 <strong>提示</strong>: 现在就可以点击右下角的悬浮小球试试效果！</p>
        </div>
    </div>
</template>

<script setup lang="ts">
// 这个页面主要用于演示悬浮控制器的效果
// 不需要额外的逻辑，悬浮控制器会自动显示
</script>

<style scoped lang="scss">
.floating-controller-demo {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;

    .demo-header {
        text-align: center;
        margin-bottom: 40px;
        padding: 40px 20px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

        h1 {
            font-size: 2.5rem;
            color: #333;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        p {
            font-size: 1.2rem;
            color: #666;
            margin: 0;
        }
    }

    .demo-content {
        display: grid;
        gap: 24px;
        margin-bottom: 40px;
    }

    .feature-card {
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
        }

        h3 {
            color: #333;
            margin-bottom: 16px;
            font-size: 1.3rem;
        }

        ul {
            list-style: none;
            padding: 0;
            margin: 0;

            li {
                padding: 8px 0;
                color: #555;
                font-size: 1rem;
            }
        }

        ol {
            padding-left: 20px;
            color: #555;

            li {
                padding: 8px 0;
                font-size: 1rem;
            }
        }
    }

    .control-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-top: 16px;

        .control-item {
            padding: 16px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;

            h4 {
                margin: 0 0 8px 0;
                color: #333;
                font-size: 1.1rem;
            }

            p {
                margin: 0;
                color: #666;
                font-size: 0.9rem;
            }
        }
    }

    .scenario-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin-top: 16px;

        .scenario-item {
            padding: 20px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            border-radius: 12px;
            text-align: center;

            h4 {
                margin: 0 0 12px 0;
                font-size: 1.2rem;
            }

            p {
                margin: 0;
                font-size: 0.95rem;
                opacity: 0.9;
            }
        }
    }

    .demo-footer {
        text-align: center;
        padding: 20px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 12px;
        backdrop-filter: blur(10px);

        p {
            margin: 0;
            font-size: 1.1rem;
            color: #333;
        }
    }
}

@media (max-width: 768px) {
    .floating-controller-demo {
        padding: 16px;

        .demo-header {
            padding: 24px 16px;
            margin-bottom: 24px;

            h1 {
                font-size: 2rem;
            }

            p {
                font-size: 1rem;
            }
        }

        .feature-card {
            padding: 20px;
        }

        .control-grid,
        .scenario-grid {
            grid-template-columns: 1fr;
        }
    }
}
</style>
