# Jenkins任务配置指南

## 概述

本文档详细说明如何在Jenkins中创建Pipeline任务并配置相关凭证。

## 一、Jenkins环境准备

### 1.1 安装必要插件

在Jenkins管理界面 → 插件管理 → 可用插件中搜索并安装：

| 插件名称 | 用途 |
|---------|------|
| Git Plugin | Git代码管理 |
| Pipeline Plugin | Pipeline支持 |
| Generic Webhook Trigger | 通用Webhook触发 |
| SSH Pipeline Steps | SSH远程执行 |
| Docker Pipeline | Docker集成 |
| NodeJS Plugin | Node.js环境 |

### 1.2 配置Node.js环境

1. 进入 Jenkins管理 → 全局工具配置
2. 找到 "NodeJS" 部分 → 点击 "添加NodeJS"
3. 填写名称：`NodeJS 18.x`
4. 勾选 "自动安装"
5. 选择版本：`18.x`
6. 保存配置

## 二、配置凭证

### 2.1 添加Git凭证

1. 进入 Jenkins管理 → 凭证管理 → 系统 → 全局凭证
2. 点击 "添加凭证"
3. 选择类型：**Username with password**
4. 填写：
   - Username: Git仓库用户名
   - Password: Git仓库密码或Access Token
   - ID: `git-credentials`（自定义）
   - 描述: `Git仓库凭证`
5. 点击确定

### 2.2 添加Docker镜像仓库凭证

1. 点击 "添加凭证"
2. 选择类型：**Username with password**
3. 填写：
   - Username: Docker仓库用户名
   - Password: Docker仓库密码
   - ID: `docker-registry-creds`
   - 描述: `Docker镜像仓库凭证`
4. 点击确定

### 2.3 添加服务器SSH凭证

1. 点击 "添加凭证"
2. 选择类型：**SSH Username with private key**
3. 填写：
   - Username: 服务器登录用户名
   - Private Key: 选择 "Enter directly"，粘贴私钥内容
   - ID: `server-ssh-creds`
   - 描述: `服务器SSH凭证`
4. 点击确定

## 三、创建Pipeline任务

### 3.1 新建任务

1. 进入Jenkins首页 → 点击 "新建任务"
2. 填写任务名称：`vue-frontend-cicd`
3. 选择类型：**Pipeline**
4. 点击确定

### 3.2 配置任务基本信息

1. **描述**：填写任务描述，如 "Vue前端项目CI/CD流水线"

### 3.3 配置构建触发器

1. 勾选 **Generic Webhook Trigger**
2. 配置：
   - Token: 输入自定义token，如 `vue-frontend-token-123`
   - 勾选 "Print post content"（调试用）

### 3.4 配置Pipeline

1. 在 "Pipeline" 部分选择 "Pipeline script from SCM"
2. SCM选择 **Git**
3. 填写：
   - Repository URL: 你的Git仓库地址，如 `https://github.com/username/vue-frontend.git`
   - Credentials: 选择之前配置的 `git-credentials`
   - Branch Specifier: `*/main, */develop, */hotfix/*, */release/*`
4. Script Path: 填写 `Jenkinsfile`（相对于仓库根目录）

### 3.5 配置高级选项

1. 点击 "高级" 展开更多选项
2. 勾选 "Poll SCM"（作为Webhook的备选方案）
3. Schedule: `H/5 * * * *`（每5分钟检查一次）

## 四、配置全局环境变量

1. 进入 Jenkins管理 → 配置系统
2. 找到 "全局属性" 部分
3. 勾选 "环境变量"
4. 添加以下变量：

| 变量名 | 值示例 | 说明 |
|-------|-------|------|
| `DEV_SERVER_IP` | `192.168.1.100` | 开发服务器IP |
| `TEST_SERVER_IP` | `192.168.1.101` | 测试服务器IP |
| `PROD_SERVER_IP` | `192.168.1.102` | 生产服务器IP |
| `DOCKER_REGISTRY` | `registry.example.com` | Docker镜像仓库地址 |
| `DOCKER_IMAGE_NAME` | `vue-frontend` | Docker镜像名称 |

## 五、测试Pipeline

### 5.1 手动触发构建

1. 进入Pipeline任务页面
2. 点击 "立即构建"
3. 查看构建日志

### 5.2 验证各阶段

确保Pipeline的每个阶段都能正常执行：

1. **Checkout**：代码拉取成功
2. **Install Dependencies**：依赖安装成功
3. **Build**：项目构建成功
4. **Lint & Type Check**：代码检查通过
5. **Docker Build**：镜像构建并推送成功
6. **Deploy**：部署到服务器成功
7. **Notify**：通知发送成功

## 六、配置邮件通知（可选）

### 6.1 安装插件

安装 **Email Extension Plugin**

### 6.2 配置邮件服务器

1. 进入 Jenkins管理 → 系统配置
2. 找到 "Jenkins Location"：
   - System Admin e-mail address: `jenkins@example.com`
3. 找到 "Extended E-mail Notification"：
   - SMTP server: `smtp.example.com`
   - SMTP port: `587`
   - Use SSL: 勾选
   - SMTP Authentication: 勾选
   - User Name: `jenkins@example.com`
   - Password: 邮箱密码

### 6.3 配置Pipeline中的邮件通知

在Jenkinsfile中添加：

```groovy
stage('Notify') {
  steps {
    emailext(
      to: 'dev-team@example.com',
      subject: "Build ${currentBuild.result}: ${JOB_NAME} #${BUILD_NUMBER}",
      body: """
        <h2>Pipeline执行结果</h2>
        <p>项目: ${JOB_NAME}</p>
        <p>构建: #${BUILD_NUMBER}</p>
        <p>状态: ${currentBuild.result}</p>
        <p>分支: ${BRANCH_NAME}</p>
        <p>环境: ${TARGET_ENV}</p>
        <p>链接: <a href="${BUILD_URL}">${BUILD_URL}</a></p>
      """
    )
  }
}
```

## 七、配置Slack通知（可选）

### 7.1 安装插件

安装 **Slack Notification Plugin**

### 7.2 配置Slack

1. 在Slack中创建Incoming Webhook
2. 进入 Jenkins管理 → 系统配置
3. 找到 "Slack" 部分：
   - Workspace: 你的Slack工作区
   - Credential: 添加Slack Webhook URL
   - Channel: 默认通知频道

### 7.3 在Pipeline中添加Slack通知

```groovy
stage('Notify') {
  steps {
    slackSend(
      channel: '#ci-cd',
      color: currentBuild.result == 'SUCCESS' ? 'good' : 'danger',
      message: "构建 #${BUILD_NUMBER} ${currentBuild.result}: ${JOB_NAME} (${BRANCH_NAME})"
    )
  }
}
```

## 八、常见问题

### 8.1 代码拉取失败

1. 检查Git凭证是否正确
2. 检查网络连接是否正常
3. 检查仓库URL是否正确

### 8.2 依赖安装失败

1. 检查Node.js环境是否配置正确
2. 检查网络连接是否正常
3. 检查package.json是否存在语法错误

### 8.3 Docker镜像构建失败

1. 检查Dockerfile是否存在语法错误
2. 检查Docker守护进程是否运行
3. 检查磁盘空间是否充足

### 8.4 部署失败

1. 检查SSH凭证是否正确
2. 检查服务器IP是否正确
3. 检查服务器防火墙是否开放SSH端口
4. 检查服务器上Docker是否安装

### 8.5 Webhook无法触发

1. 检查Webhook URL是否正确
2. 检查Token是否匹配
3. 检查Jenkins服务器是否可从公网访问

## 九、Jenkins安全配置

### 9.1 启用安全

1. 进入 Jenkins管理 → 全局安全配置
2. 勾选 "启用安全"
3. 选择认证方式：如 "Jenkins专有用户数据库"
4. 添加管理员用户

### 9.2 配置权限

1. 在全局安全配置中找到 "授权策略"
2. 选择 "项目矩阵授权策略"
3. 为不同用户分配不同权限

### 9.3 使用HTTPS

1. 生成SSL证书
2. 在Jenkins启动参数中添加：
   ```
   --httpsPort=8443 --httpsCertificate=/path/to/cert.pem --httpsPrivateKey=/path/to/key.pem
   ```

## 十、Jenkins备份与恢复

### 10.1 备份

```bash
sudo tar -czvf jenkins-backup-$(date +%Y%m%d).tar.gz /var/lib/jenkins/
```

### 10.2 恢复

```bash
sudo tar -xzvf jenkins-backup-20240101.tar.gz -C /var/lib/jenkins/
sudo systemctl restart jenkins
```