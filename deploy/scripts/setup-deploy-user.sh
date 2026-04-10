#!/usr/bin/env bash
# 在 ECS 上以 root 执行一次：创建仅用于部署的 Linux 用户并配置权限。
# GitHub Actions 使用 SSH 密码（仓库 Secret ECS_SSH_PASSWORD），请 passwd 并允许 sshd 密码登录。
# 可选公钥：sudo DEPLOY_SSH_PUBLIC_KEY='ssh-ed25519 AAAA...' bash setup-deploy-user.sh
#
# 说明：加入 docker 组后，用户可通过 Docker 套接字获得与 root 等效的主机能力（Docker 通用限制）。

set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-docker-deploy}"
DEPLOY_HOME="/home/${DEPLOY_USER}"
# 默认与 deploy.sh、compose 中路径一致：应用文件放在部署用户家目录
APP_ROOT="${APP_ROOT:-${DEPLOY_HOME}}"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "请使用 root 运行：sudo bash $0" >&2
  exit 1
fi

if ! getent group docker >/dev/null 2>&1; then
  echo "未找到组 docker。请先安装 Docker。" >&2
  exit 1
fi

if id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
  echo "用户已存在：${DEPLOY_USER}"
else
  useradd --create-home --shell /bin/bash "${DEPLOY_USER}"
  echo "已创建用户：${DEPLOY_USER}"
fi

usermod -aG docker "${DEPLOY_USER}"
echo "已将 ${DEPLOY_USER} 加入 docker 组（重新登录 SSH 后生效）。"

if [[ "${APP_ROOT}" != "${DEPLOY_HOME}" ]]; then
  install -d -m 0750 -o root -g "${DEPLOY_USER}" "${APP_ROOT}"
fi

COMPOSE_DST="${APP_ROOT}/docker-compose.prod.yml"
if [[ -f "${COMPOSE_DST}" ]]; then
  chown "${DEPLOY_USER}:${DEPLOY_USER}" "${COMPOSE_DST}"
  chmod 0644 "${COMPOSE_DST}"
fi

ENV_PROD="${APP_ROOT}/.env.production"
if [[ -f "${ENV_PROD}" ]]; then
  chown "${DEPLOY_USER}:${DEPLOY_USER}" "${ENV_PROD}"
  chmod 0600 "${ENV_PROD}"
else
  echo "提示：尚未存在 ${ENV_PROD}，请拷贝生产 .env.production 后："
  echo "  chown ${DEPLOY_USER}:${DEPLOY_USER} ${ENV_PROD} && chmod 600 ${ENV_PROD}"
fi

SSH_DIR="${DEPLOY_HOME}/.ssh"
install -d -m 0700 -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" "${SSH_DIR}"

AUTH_KEYS="${SSH_DIR}/authorized_keys"
if [[ -n "${DEPLOY_SSH_PUBLIC_KEY:-}" ]]; then
  if grep -qxF "${DEPLOY_SSH_PUBLIC_KEY}" "${AUTH_KEYS}" 2>/dev/null; then
    echo "authorized_keys 中已包含该公钥。"
  else
    printf '%s\n' "${DEPLOY_SSH_PUBLIC_KEY}" >> "${AUTH_KEYS}"
    chown "${DEPLOY_USER}:${DEPLOY_USER}" "${AUTH_KEYS}"
    chmod 0600 "${AUTH_KEYS}"
    echo "已写入 ${AUTH_KEYS}"
  fi
else
  echo "未配置 DEPLOY_SSH_PUBLIC_KEY。若仅用密码：passwd ${DEPLOY_USER}，并允许 sshd PasswordAuthentication。"
  echo "（可选）手工追加公钥：nano ${AUTH_KEYS}"
fi

if [[ -f "${APP_ROOT}/deploy.sh" ]]; then
  chown "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_ROOT}/deploy.sh"
  chmod 0755 "${APP_ROOT}/deploy.sh"
fi

echo
echo "后续步骤："
echo "  1) 将 deploy/docker-compose.prod.yml、deploy/scripts/deploy.sh、.env.production 拷到 ${APP_ROOT}/"
echo "  2) passwd ${DEPLOY_USER}，密码写入 GitHub Secret ECS_SSH_PASSWORD"
echo "  3) CI 写入 ${DEPLOY_HOME}/.zhangyuan.env.images 并执行 bash ${DEPLOY_HOME}/deploy.sh"
echo "  4) 测试：ssh ${DEPLOY_USER}@<ECS> 后 bash ~/deploy.sh"
