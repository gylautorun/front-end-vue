# Webhook配置指导

## 概述

Webhook用于在Git代码提交时自动触发Jenkins Pipeline构建。本文档详细说明如何在主流Git平台上配置Webhook。

## 一、Jenkins端配置

### 1.1 安装插件

确保Jenkins安装了以下插件：

- **Git Plugin**
- **GitHub Integration Plugin**（GitHub专用）
- **GitLab Plugin**（GitLab专用）
- **Generic Webhook Trigger**（通用Webhook）

在Jenkins管理界面 → 插件管理中搜索并安装。

### 1.2 配置Pipeline项目

1. 进入Jenkins首页 → 新建任务
2. 选择 "Pipeline" 类型
3. 填写任务名称 → 确定
4. 在配置页面找到 "Build Triggers" 部分

### 1.3 配置触发方式

#### 方式一：使用Generic Webhook Trigger（推荐）

1. 勾选 "Generic Webhook Trigger"
2. 配置 Token（用于验证请求来源）
3. 配置触发条件

#### 方式二：使用GitHub/GitLab专用Trigger

根据你的Git平台选择对应选项。

## 二、GitHub Webhook配置

### 2.1 进入GitHub仓库设置

1. 打开你的GitHub仓库
2. 点击 "Settings" → "Webhooks" → "Add webhook"

### 2.2 配置Webhook参数

| 参数 | 值 |
|------|-----|
| **Payload URL** | `http://<jenkins-server>:<port>/generic-webhook-trigger/invoke?token=<your-token>` |
| **Content type** | `application/json` |
| **Secret** | 自定义密钥（可选，用于签名验证） |
| **Which events would you like to trigger this webhook?** | 选择 "Just the push event" |
| **Active** | 勾选 |

### 2.3 GitHub Token配置

在Jenkins中添加GitHub凭证：

1. Jenkins → 凭证管理 → 系统 → 全局凭证
2. 添加凭证 → 选择 "Secret text"
3. Secret 填写 GitHub Personal Access Token
4. 描述填写 "github-token"

### 2.4 测试Webhook

1. 在GitHub仓库中点击 "Test"
2. 选择 "push" 事件
3. 检查Jenkins是否收到请求并触发构建

## 三、GitLab Webhook配置

### 3.1 进入GitLab仓库设置

1. 打开你的GitLab仓库
2. 点击 "Settings" → "Integrations"

### 3.2 配置Webhook参数

| 参数 | 值 |
|------|-----|
| **URL** | `http://<jenkins-server>:<port>/project/<job-name>` |
| **Secret token** | 自定义密钥 |
| **Trigger** | 勾选 "Push events" |
| **Branch filter** | `main|develop|hotfix/*|release/*` |

### 3.3 Jenkins配置

在Pipeline项目中：

1. 勾选 "Build when a change is pushed to GitLab"
2. 配置 GitLab CI Service URL 和 Secret token
3. 在高级选项中配置触发条件

## 四、Gitee Webhook配置

### 4.1 进入Gitee仓库设置

1. 打开你的Gitee仓库
2. 点击 "管理" → "WebHooks" → "添加WebHook"

### 4.2 配置Webhook参数

| 参数 | 值 |
|------|-----|
| **URL** | `http://<jenkins-server>:<port>/generic-webhook-trigger/invoke?token=<your-token>` |
| **HTTP方法** | `POST` |
| **Content Type** | `application/json` |
| **Secret** | 自定义密钥 |
| **触发事件** | 勾选 "Push" |

## 五、Webhook安全配置

### 5.1 使用Token验证

在Jenkins的Generic Webhook Trigger中配置Token，确保只有携带正确Token的请求才能触发构建。

### 5.2 使用IP白名单

在Jenkins服务器的防火墙中添加Git平台的IP地址白名单：

**GitHub IP范围**：
```
192.30.252.0/22
185.199.108.0/22
140.82.112.0/20
```

**GitLab IP范围**：
```
35.185.44.0/22
```

### 5.3 使用HTTPS

配置Jenkins使用HTTPS，避免Token在传输过程中被窃取。

## 六、Jenkins Pipeline触发配置

### 6.1 在Jenkinsfile中添加触发条件

```groovy
pipeline {
  triggers {
    GenericTrigger(
      genericVariables: [
        [key: 'BRANCH_NAME', value: '$.ref'],
        [key: 'COMMIT_MESSAGE', value: '$.head_commit.message']
      ],
      causeString: 'Triggered by $BRANCH_NAME',
      token: 'your-secret-token',
      printContributedVariables: true,
      printPostContent: true,
      silentResponse: false
    )
  }
}
```

### 6.2 配置分支过滤

在Jenkins项目配置中设置分支过滤：

```
main|develop|hotfix/*|release/*
```

### 6.3 配置提交消息过滤

可以根据提交消息中的关键字决定是否触发构建：

```groovy
if (COMMIT_MESSAGE.contains('[skip ci]')) {
  echo "提交消息包含[skip ci]，跳过构建"
  return
}
```

## 七、测试Webhook

### 7.1 使用curl测试

```bash
curl -X POST \
  http://<jenkins-server>:<port>/generic-webhook-trigger/invoke \
  -H 'Content-Type: application/json' \
  -H 'token: your-secret-token' \
  -d '{
    "ref": "refs/heads/main",
    "head_commit": {
      "message": "test webhook"
    }
  }'
```

### 7.2 检查Jenkins日志

在Jenkins系统日志中查看Webhook请求是否被正确处理：

```
Jenkins管理 → 系统日志 → 日志级别设置为 FINE
```

## 八、常见问题

### 8.1 Webhook无法触发构建

1. 检查Jenkins服务器是否可从公网访问
2. 检查防火墙是否开放了Jenkins端口
3. 检查Webhook URL是否正确
4. 检查Token是否匹配

### 8.2 构建被触发但失败

1. 检查Jenkins日志
2. 检查Pipeline语法是否正确
3. 检查Git凭证是否配置正确

### 8.3 重复触发构建

1. 检查是否配置了多个Webhook
2. 检查是否同时使用了pollSCM和Webhook
3. 在Git平台取消不需要的触发事件

### 8.4 GitHub Webhook显示403错误

1. 检查Jenkins是否配置了正确的凭证
2. 检查Jenkins服务器时间是否同步
3. 检查GitHub Personal Access Token权限

## 九、自动化触发规则总结

| 分支类型 | 触发事件 | 目标环境 |
|---------|---------|---------|
| `main` | push | 生产环境 |
| `develop` | push | 测试环境 |
| `hotfix/*` | push | 生产环境 |
| `release/*` | push | 测试环境 |
| `feature/*` | 手动触发 | 开发环境 |

## 十、最佳实践

1. **使用Secret token**：始终配置Webhook的Secret token，防止恶意触发
2. **限制触发分支**：只对必要的分支配置自动触发
3. **使用环境变量**：将敏感信息（如Token）存储在Jenkins环境变量中
4. **监控Webhook状态**：定期检查Git平台的Webhook状态
5. **记录构建日志**：完整记录每次构建的日志，便于问题排查