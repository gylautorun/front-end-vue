# 服务器配置指导

## 服务器环境要求

| 项目 | 要求 |
|------|------|
| 操作系统 | Ubuntu 20.04 / CentOS 7+ |
| CPU | 2核以上 |
| 内存 | 4GB以上 |
| 硬盘 | 20GB以上可用空间 |
| 网络 | 公网IP，开放80/443端口 |

## 一、安装Docker

### Ubuntu系统

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
```

### CentOS系统

```bash
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
```

### 验证安装

```bash
docker --version
docker run hello-world
```

## 二、安装Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

## 三、配置Docker镜像加速

创建或编辑 `/etc/docker/daemon.json`

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
```

重启Docker服务

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 四、创建项目目录结构

```bash
sudo mkdir -p /opt/app/{nginx,logs,html}
sudo chown -R $USER:$USER /opt/app
```

## 五、配置Nginx反向代理（可选）

如果需要在宿主机配置Nginx做统一入口，执行以下步骤：

### 安装Nginx

```bash
# Ubuntu
sudo apt-get install -y nginx

# CentOS
sudo yum install -y nginx
```

### 创建站点配置

创建 `/etc/nginx/conf.d/vue-frontend.conf`

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 重启Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 六、配置SSL证书（可选）

### 使用Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

## 七、配置防火墙

### Ubuntu (ufw)

```bash
sudo ufw enable
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
```

### CentOS (firewalld)

```bash
sudo firewall-cmd --zone=public --add-port=80/tcp --permanent
sudo firewall-cmd --zone=public --add-port=443/tcp --permanent
sudo firewall-cmd --zone=public --add-port=22/tcp --permanent
sudo firewall-cmd --reload
```

## 八、配置SSH免密登录（Jenkins部署用）

### 在Jenkins服务器上生成密钥对

```bash
ssh-keygen -t rsa -b 4096 -C "jenkins@example.com"
```

### 将公钥复制到目标服务器

```bash
ssh-copy-id user@server-ip
```

### 在目标服务器配置sudo免密

编辑 `/etc/sudoers`

```bash
sudo visudo
```

添加以下内容：

```
jenkins ALL=(ALL) NOPASSWD: ALL
```

## 九、手动部署测试

```bash
cd /opt/app
docker-compose up -d
```

### 检查服务状态

```bash
docker-compose ps
docker logs vue-frontend
```

### 停止服务

```bash
docker-compose down
```

## 十、服务器安全建议

1. **禁用root登录**：编辑 `/etc/ssh/sshd_config`，设置 `PermitRootLogin no`
2. **修改SSH端口**：编辑 `/etc/ssh/sshd_config`，设置 `Port 2222`
3. **启用防火墙**：只开放必要端口
4. **定期更新系统**：`sudo apt update && sudo apt upgrade`
5. **安装fail2ban**：防止暴力破解

```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 十一、环境变量配置

在Jenkins中配置以下全局环境变量：

| 变量名 | 值示例 | 说明 |
|-------|-------|------|
| `DEV_SERVER_IP` | `192.168.1.100` | 开发服务器IP |
| `TEST_SERVER_IP` | `192.168.1.101` | 测试服务器IP |
| `PROD_SERVER_IP` | `192.168.1.102` | 生产服务器IP |
| `DOCKER_REGISTRY` | `registry.example.com` | Docker镜像仓库地址 |
| `DOCKER_CREDENTIAL_ID` | `docker-registry-creds` | Docker仓库凭证ID |
| `SERVER_SSH_CREDENTIAL_ID` | `server-ssh-creds` | 服务器SSH凭证ID |

## 十二、常见问题

### Docker命令需要sudo权限

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 容器启动失败

```bash
docker logs vue-frontend
docker-compose down && docker-compose up
```

### Nginx 403错误

检查目录权限：

```bash
sudo chown -R nginx:nginx /usr/share/nginx/html
```