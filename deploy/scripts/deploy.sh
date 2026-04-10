#!/usr/bin/env bash
# 在 ECS 上由部署用户执行：登录 ACR → 按先后端再前端拉取并启动。
# 依赖环境变量（可由 CI 注入，或 export 后执行）：
#   ACR_REGISTRY   例：registry.cn-hangzhou.aliyuncs.com
#   ACR_USERNAME
#   ACR_PASSWORD
#
# 依赖文件（默认与 docker-deploy 家目录一致，避免 /home/zhangyuan.net 等 root 目录写权限问题）：
#   ${APP_ROOT}/docker-compose.prod.yml
#   ${APP_ROOT}/.env.production
#   镜像变量：CI 设 ENV_IMAGES=${HOME}/.zhangyuan.env.images；手工可设 ${APP_ROOT}/.env.images

set -euo pipefail

APP_ROOT="${APP_ROOT:-/home/docker-deploy}"
COMPOSE_FILE="${COMPOSE_FILE:-${APP_ROOT}/docker-compose.prod.yml}"
ENV_IMAGES="${ENV_IMAGES:-${APP_ROOT}/.env.images}"

cd "${APP_ROOT}"

: "${ACR_REGISTRY:?缺少 ACR_REGISTRY}"
: "${ACR_USERNAME:?缺少 ACR_USERNAME}"
: "${ACR_PASSWORD:?缺少 ACR_PASSWORD}"

R="${ACR_REGISTRY#http://}"
R="${R#https://}"
R="${R%/}"

echo "${ACR_PASSWORD}" | docker login "${R}" --username "${ACR_USERNAME}" --password-stdin

docker compose --env-file "${ENV_IMAGES}" -f "${COMPOSE_FILE}" pull backend
docker compose --env-file "${ENV_IMAGES}" -f "${COMPOSE_FILE}" up -d backend
docker compose --env-file "${ENV_IMAGES}" -f "${COMPOSE_FILE}" pull frontend
docker compose --env-file "${ENV_IMAGES}" -f "${COMPOSE_FILE}" up -d frontend

docker image prune -f

echo "部署完成。"
