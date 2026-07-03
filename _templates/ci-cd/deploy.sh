#!/bin/bash

# ========================================
# 服务器端部署脚本
# 用于自动化部署Vue前端项目
# 功能: 拉取镜像→停止容器→更新配置→启动容器→健康检查→清理旧镜像
# 使用方式: bash deploy.sh [环境] [镜像标签]
# 示例: bash deploy.sh production latest
# ========================================

# set -e: 脚本遇到错误时立即退出
# 避免错误继续执行导致更严重的问题
set -e

# 环境变量定义
# ${1:-production}: 获取第一个参数，默认为production
ENVIRONMENT="${1:-production}"
# ${2:-latest}: 获取第二个参数，默认为latest
IMAGE_TAG="${2:-latest}"
# Docker镜像仓库地址，需要替换为实际地址
DOCKER_REGISTRY="registry.example.com"
# Docker镜像名称
DOCKER_IMAGE_NAME="vue-frontend"
# 应用部署目录
APP_DIR="/opt/app"

# log_info函数: 打印信息日志
# 格式: [日期时间] INFO: 消息内容
log_info() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1"
}

# log_error函数: 打印错误日志
# 格式: [日期时间] ERROR: 消息内容
# >&2: 将输出重定向到标准错误流
log_error() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# check_docker函数: 检查Docker和Docker Compose是否安装
check_docker() {
  # command -v docker: 检查docker命令是否存在
  # &> /dev/null: 屏蔽输出
  if ! command -v docker &> /dev/null; then
    log_error "Docker未安装，请先安装Docker"
    exit 1
  fi

  if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose未安装，请先安装Docker Compose"
    exit 1
  fi
}

# pull_image函数: 从镜像仓库拉取指定版本的镜像
pull_image() {
  log_info "拉取Docker镜像: ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${IMAGE_TAG}"
  docker pull "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${IMAGE_TAG}"
}

# stop_container函数: 停止当前运行的容器
stop_container() {
  log_info "停止当前容器"
  # docker-compose down: 停止并移除容器、网络
  docker-compose -f "${APP_DIR}/docker-compose.yml" down
}

# update_compose函数: 更新docker-compose.yml中的镜像标签
update_compose() {
  log_info "更新docker-compose.yml配置"
  # sed -i: 原地修改文件
  # s|image:.*|image: xxx|: 替换image行的内容
  sed -i "s|image:.*|image: ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${IMAGE_TAG}|" "${APP_DIR}/docker-compose.yml"
}

# start_container函数: 启动容器
start_container() {
  log_info "启动容器"
  # docker-compose up -d: 后台启动容器
  # --remove-orphans: 移除不在compose文件中的容器
  docker-compose -f "${APP_DIR}/docker-compose.yml" up -d --remove-orphans
}

# check_health函数: 检查服务健康状态
check_health() {
  log_info "检查服务健康状态"
  # sleep 10: 等待10秒让服务启动
  sleep 10

  # docker-compose ps: 查看容器状态
  # grep -q "Up": 检查是否有"Up"状态的容器
  if docker-compose -f "${APP_DIR}/docker-compose.yml" ps | grep -q "Up"; then
    log_info "服务启动成功"
  else
    log_error "服务启动失败，查看日志:"
    # docker-compose logs: 查看容器日志
    docker-compose -f "${APP_DIR}/docker-compose.yml" logs
    exit 1
  fi
}

# cleanup_old_images函数: 清理旧镜像
cleanup_old_images() {
  log_info "清理旧镜像（保留最近3个）"
  # docker images --format: 格式化输出
  # grep: 筛选目标镜像
  # sort -r: 逆序排序（最新的在前）
  # tail -n +4: 跳过前3个（保留最近3个）
  # xargs -r docker rmi -f: 删除筛选出的镜像
  # 2>/dev/null: 屏蔽错误输出
  # || true: 即使删除失败也不影响脚本执行
  docker images --format '{{.Repository}}:{{.Tag}}' \
    | grep "${DOCKER_IMAGE_NAME}" \
    | sort -r \
    | tail -n +4 \
    | xargs -r docker rmi -f 2>/dev/null || true
}

# main函数: 主部署流程
main() {
  log_info "========== 开始部署 ${ENVIRONMENT} 环境 =========="

  # 检查Docker环境
  check_docker

  # 检查应用目录是否存在，不存在则创建
  if [ ! -d "${APP_DIR}" ]; then
    log_info "创建应用目录: ${APP_DIR}"
    mkdir -p "${APP_DIR}"
  fi

  # 执行部署步骤
  pull_image       # 1. 拉取镜像
  stop_container   # 2. 停止旧容器
  update_compose   # 3. 更新配置
  start_container  # 4. 启动新容器
  check_health     # 5. 健康检查
  cleanup_old_images # 6. 清理旧镜像

  log_info "========== 部署完成 =========="
}

# 脚本入口
# ${BASH_SOURCE[0]} == "${0}": 检查脚本是否被直接执行
# 如果是直接执行，调用main函数；如果是被source引入，不执行
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
  main "$@"
fi