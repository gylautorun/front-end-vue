# 第一阶段：构建阶段（builder）
# 使用Node.js 18 Alpine镜像作为构建基础
# Alpine版本体积更小，适合生产环境
FROM node:18-alpine AS builder

# 设置工作目录为/app
# 后续所有命令都将在这个目录下执行
WORKDIR /app

# 先复制package.json和pnpm-lock.yaml
# 这是一个优化技巧：利用Docker分层缓存
# 只有当依赖文件变化时才会重新执行pnpm install
COPY package.json pnpm-lock.yaml ./

# 安装pnpm并安装项目依赖
# --frozen-lockfile确保依赖版本严格按照lockfile安装，避免意外更新
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 复制项目源代码到工作目录
COPY . .

# 定义构建参数BUILD_ENV，默认值为production
# 可以通过docker build --build-arg BUILD_ENV=staging来覆盖
ARG BUILD_ENV=production

# 根据不同环境执行构建命令
# 这里可以根据需要添加不同环境的构建参数
RUN if [ "$BUILD_ENV" = "production" ]; then \
      pnpm run build; \
    elif [ "$BUILD_ENV" = "staging" ]; then \
      pnpm run build; \
    else \
      pnpm run build; \
    fi

# 第二阶段：生产阶段（runtime）
# 使用Nginx Alpine镜像作为运行时基础
# 多阶段构建可以大幅减小最终镜像体积（只包含运行时需要的文件）
FROM nginx:alpine

# 从builder阶段复制构建产物到Nginx的静态文件目录
# /usr/share/nginx/html是Nginx默认的静态资源目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义的Nginx配置文件
# 覆盖默认的nginx.conf配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露容器的80端口
# 告知Docker容器将监听80端口（实际还需要通过-p参数映射到宿主机）
EXPOSE 80

# 启动Nginx服务
# daemon off表示以非守护进程方式运行，便于Docker管理
CMD ["nginx", "-g", "daemon off;"]