# 生产服务器部署准备（仅命令）

部署用户：**`docker-deploy`**。推荐把 **`docker-compose.prod.yml`、`deploy.sh`、`.env.production`** 都放在该用户家目录 **`/home/docker-deploy/`**（与仓库内 compose 中 `env_file` 路径一致），避免 root 拥有的 `/home/zhangyuan.net` 无写权限问题。

GitHub Actions 使用 **SSH 密码**（`ECS_SSH_PASSWORD`）。

**说明：** `docker-deploy` 在 `docker` 组内时，在默认 Docker 安装下具备与 root 等效的主机能力。

---

## 一、仅创建用户（单独执行）

```bash
id -u docker-deploy &>/dev/null || useradd --create-home --shell /bin/bash docker-deploy
usermod -aG docker docker-deploy
passwd docker-deploy
```

将密码写入 GitHub Secret **`ECS_SSH_PASSWORD`**。

---

## 二、文件放置与权限（家目录方案）

把仓库里的 **`deploy/docker-compose.prod.yml`**、**`deploy/scripts/deploy.sh`**、生产用 **`.env.production`** 放到 **`/home/docker-deploy/`**（用 `scp` 或 root 拷贝后再 `chown`）。

```bash
DEPLOY_USER=docker-deploy
DEPLOY_HOME=/home/docker-deploy

chown "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_HOME}/docker-compose.prod.yml" "${DEPLOY_HOME}/deploy.sh" "${DEPLOY_HOME}/.env.production" 2>/dev/null || true
chmod 0644 "${DEPLOY_HOME}/docker-compose.prod.yml"
chmod 0600 "${DEPLOY_HOME}/.env.production"
chmod 0755 "${DEPLOY_HOME}/deploy.sh"
```

若从 Windows 拷贝导致无执行位，仍可通过 **`bash ~/deploy.sh`** 运行；CI 已使用 `bash "$HOME/deploy.sh"`。

若出现 **`$'\r': command not found`** 或 **`set: pipefail: invalid option`**，说明脚本是 **CRLF 换行**。在服务器执行：`sed -i 's/\r$//' /home/docker-deploy/deploy.sh`（或重新用仓库里已改为 LF 的版本覆盖）。仓库已加 **`.gitattributes`** 强制 `*.sh` 使用 LF。

---

## 三、允许 SSH 密码登录（sshd）

```bash
grep -RniE 'PasswordAuthentication|KbdInteractiveAuthentication' /etc/ssh/sshd_config /etc/ssh/sshd_config.d/*.conf 2>/dev/null

printf '%s\n' 'PasswordAuthentication yes' > /etc/ssh/sshd_config.d/99-password-docker-deploy.conf
systemctl reload sshd
```

---

## 四、从本机 scp 示例

```bash
scp deploy/docker-compose.prod.yml docker-deploy@<ECS>:/home/docker-deploy/
scp deploy/scripts/deploy.sh docker-deploy@<ECS>:/home/docker-deploy/deploy.sh
scp /path/to/.env.production docker-deploy@<ECS>:/home/docker-deploy/.env.production
```

---

## 五、自定义应用目录（可选）

若 **compose 仍在 `/home/zhangyuan.net/`**，在运行前执行：

```bash
export APP_ROOT=/home/zhangyuan.net
```

并自行把 **`deploy/docker-compose.prod.yml` 里 `env_file`** 改成实际 `.env.production` 路径，或在该目录下放同名文件。

---

## 六、反向代理提醒

前端容器监听 **`127.0.0.1:3000`**。Nginx 等：站点反代到 `http://127.0.0.1:3000`，**`/api`** 反代到 `http://127.0.0.1:8000`。
