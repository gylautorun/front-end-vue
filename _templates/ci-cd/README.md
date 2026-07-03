# CI/CD 流程文档

## 概述

本项目采用 **Jenkins + Docker + Nginx** 构建完整的CI/CD流程，实现代码提交自动触发构建部署。

## 技术栈

- **构建工具**: Vite 3.x
- **包管理器**: pnpm
- **前端框架**: Vue 3 + TypeScript
- **CI/CD工具**: Jenkins
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx

## 整体CI/CD流程图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Git 仓库                                        │
│   main(生产)    develop(测试)    feature/*(开发)    hotfix/*(修复)       │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Jenkins Server                                  │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐              │
│   │   代码拉取     │→│   依赖安装     │→│   构建测试     │              │
│   │  Checkout     │  │  pnpm install │  │  pnpm build   │              │
│   └───────────────┘  └───────────────┘  └───────┬───────┘              │
│                                                 │                       │
│                                                 ▼                       │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐              │
│   │  Docker Build │→│  Docker Push   │→│  部署到服务器   │              │
│   │   构建镜像     │  │  推送镜像到仓库  │  │   Deploy      │              │
│   └───────────────┘  └───────────────┘  └───────────────┘              │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   开发环境       │ │   测试环境       │ │   生产环境       │
│  Development    │ │   Staging       │ │   Production    │
│  dev.example.com│ │  test.example.com│ │ www.example.com │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Git分支策略

### 分支命名规范

| 分支类型 | 命名格式 | 用途 | 触发构建 |
|---------|---------|------|---------|
| 生产分支 | `main` | 稳定生产版本 | ✅ 自动触发 → 生产环境 |
| 测试分支 | `develop` | 集成测试版本 | ✅ 自动触发 → 测试环境 |
| 功能分支 | `feature/*` | 新功能开发 | ❌ 手动触发 → 开发环境 |
| 修复分支 | `hotfix/*` | 紧急Bug修复 | ✅ 自动触发 → 生产环境 |
| 发布分支 | `release/*` | 版本发布准备 | ✅ 自动触发 → 测试环境 |

### 分支流转流程

```
feature/xxx ──→ develop ──→ release/xxx ──→ main
                    │                             │
                    ↓                             ↓
                 测试环境                      生产环境
```

## Jenkins Pipeline 阶段说明

### 阶段一：检出代码 (Checkout)
- 从Git仓库拉取最新代码
- 根据分支名称判断部署环境

### 阶段二：依赖安装 (Install)
- 使用pnpm安装项目依赖
- 缓存依赖以加速构建

### 阶段三：构建测试 (Build & Test)
- 执行 `pnpm build` 构建项目
- 执行TypeScript类型检查

### 阶段四：Docker构建 (Docker Build)
- 根据分支构建不同tag的镜像
- 镜像命名规则：`registry.example.com/app:${BRANCH_NAME}-${BUILD_NUMBER}`

### 阶段五：Docker推送 (Docker Push)
- 推送镜像到私有镜像仓库
- 同时打上 `latest` tag

### 阶段六：部署 (Deploy)
- 根据分支名称部署到对应环境
- 使用Docker Compose启动容器

## 环境变量配置

### Jenkins全局变量

| 变量名 | 说明 | 示例值 |
|-------|------|-------|
| `DOCKER_REGISTRY` | Docker镜像仓库地址 | `registry.example.com` |
| `DOCKER_CREDENTIAL_ID` | Docker仓库凭证ID | `docker-registry-creds` |
| `SERVER_SSH_CREDENTIAL_ID` | 服务器SSH凭证ID | `server-ssh-creds` |
| `DEV_SERVER_IP` | 开发服务器IP | `192.168.1.100` |
| `TEST_SERVER_IP` | 测试服务器IP | `192.168.1.101` |
| `PROD_SERVER_IP` | 生产服务器IP | `192.168.1.102` |

### 构建参数

| 参数名 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| `BUILD_ENV` | 字符串 | `production` | 构建环境 (development/staging/production) |
| `SKIP_TEST` | 布尔 | `false` | 是否跳过测试 |

## 文件结构

```
ci-cd/
├── README.md              # CI/CD总览文档
├── server-setup.md        # 服务器配置指导
├── webhook-guide.md       # Webhook配置指导
├── Jenkinsfile            # Jenkins Pipeline配置
├── Dockerfile             # Docker镜像构建配置
├── .dockerignore          # Docker忽略文件
├── nginx.conf             # Nginx配置
└── docker-compose.yml     # Docker Compose配置
```

## 自动化触发规则

### 自动触发场景

1. **main分支**：任何push自动触发生产环境部署
2. **develop分支**：任何push自动触发测试环境部署
3. **hotfix/*分支**：任何push自动触发生产环境部署
4. **release/*分支**：任何push自动触发测试环境部署

### 手动触发场景

1. **feature/*分支**：需要手动在Jenkins中触发构建
2. 回滚操作：手动选择历史构建进行回滚

## 部署流程

### 首次部署

1. 在服务器上安装Docker和Docker Compose
2. 配置Nginx反向代理
3. 创建项目目录结构
4. 在Jenkins中配置Pipeline项目
5. 配置Git Webhook

### 日常部署

1. 开发人员提交代码到Git
2. Git触发Webhook通知Jenkins
3. Jenkins自动执行Pipeline
4. 构建成功后自动部署到对应环境

## 回滚机制

### 方式一：重新构建历史版本
1. 在Jenkins中找到对应构建
2. 点击 "Rebuild" 重新执行
3. 系统自动替换当前部署

### 方式二：使用Docker镜像回滚
1. 查看历史镜像列表：`docker images`
2. 停止当前容器：`docker-compose down`
3. 修改docker-compose.yml中的镜像tag
4. 重新启动容器：`docker-compose up -d`