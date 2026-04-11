# 阿里云 ACR + GitHub Actions + ECS 部署

本文档对应工作流：`.github/workflows/acr-ecs-deploy.yml`（**构建推送 ACR → SSH 部署 ECS**）。

---

## 镜像仓库约定（一个仓库，两套 tag）

ACR 镜像路径：`<ACR_REGISTRY>/yvan-2000/zhangyuan.net`。

| 用途 | tag |
|------|-----|
| 后端 | `b_<commit sha>`、`b_latest` |
| 前端 | `f_<commit sha>`、`f_latest` |

---

## 前端 API 地址（已写死在 compose）

`deploy/docker-compose.prod.yml` 中前端服务环境变量固定为：

- **`API_BASE_URL`**：`https://www.zhangyuan.net/api/v1`（Next 服务端请求）
- **`NEXT_PUBLIC_API_BASE_URL`**：`/api/v1`（浏览器同源相对路径）

请在 ECS 上配置 Nginx/Caddy：**站点**反代到前端 `http://127.0.0.1:3000`，**`/api`** 反代到后端 `http://127.0.0.1:8000`（与 `docker-compose.prod.yml` 中端口一致）。

---

## 工作流行为

1. **自动**：向 **`main`** 或 **`master`** 分支 **push** 即触发（合并 PR 到这些分支也会触发）。同一分支上若连续推送，未完成的上一次运行会被取消（`cancel-in-progress`）。  
2. **手动**：在 Actions 中选本工作流 → **Run workflow**。  
3. **build-push**：登录 ACR → 构建并推送后端 → 构建并推送前端。  
4. **deploy**：SSH（**密码**）登录 ECS → 写入 **`~/.zhangyuan.env.images`** → `export ENV_IMAGES` 后执行 **`bash "$HOME/deploy.sh"`**（脚本默认在 **`/home/docker-deploy/`** 与 compose、`.env.production` 同目录）。

---

## GitHub Secrets

在 `Settings -> Secrets and variables -> Actions` 配置：

| Secret | 说明 |
|--------|------|
| `ACR_REGISTRY` | 如 `registry.cn-hangzhou.aliyuncs.com`（不要带 `https://`） |
| `ACR_USERNAME` | ACR 登录用户名 |
| `ACR_PASSWORD` | ACR 登录密码 |
| `ECS_HOST` | ECS 公网或可被 GitHub 访问的 IP/域名 |
| `ECS_SSH_PASSWORD` | 用户 `docker-deploy` 的 SSH 登录密码（与服务器 `passwd` 一致） |

可选：

| Secret | 说明 |
|--------|------|
| `ECS_USER` | 不填则使用 `docker-deploy` |
| `ECS_PORT` | 不填则使用 `22` |

命名空间 **`yvan-2000`**、仓库名 **`zhangyuan.net`** 已在 workflow 中写死。

---

## 服务器准备

生产后端环境：推荐 **`/home/docker-deploy/.env.production`**（与 `docker-compose.prod.yml` 中 `env_file` 一致，勿提交仓库）。

创建用户、目录权限、密码与 `sshd`：**仅命令**见 [`deploy/SERVER-DEPLOY.md`](SERVER-DEPLOY.md)。

---

## 常见问题

- **推送失败 / denied**：见下文「推送报错 denied」。
- **SSH 部署失败**：检查安全组、`ECS_SSH_PASSWORD`、`PasswordAuthentication`、`ECS_PORT`；确认 **`/home/docker-deploy/deploy.sh`**、**`docker-compose.prod.yml`**、**`.env.production`** 已就位。若 **`deploy.sh: Permission denied`**：路径是否仍为旧的 `/home/zhangyuan.net/deploy.sh`（应改为家目录），或执行 **`chmod +x ~/deploy.sh`**；CI 已用 **`bash "$HOME/deploy.sh"`** 避免依赖可执行位。
- **容器启动失败**：在 ECS 上 `cd /home/docker-deploy && docker compose -f docker-compose.prod.yml --env-file ~/.zhangyuan.env.images ps` 与 `logs` 排查。

### 推送报错 `denied: requested access to the resource is denied`

1. **`ACR_REGISTRY` 地域**与 ACR 控制台实例公网地址一致。  
2. **Docker 登录用户名**一般不是命名空间 `yvan-2000`；按控制台「访问凭证」使用主账号或 RAM 用户名与镜像仓库密码。  
3. 命名空间、仓库 **`zhangyuan.net`** 属于当前账号；RAM 需有推送权限。  
4. 控制台已创建仓库 **`zhangyuan.net`**。

本地复现：

```bash
docker login registry.cn-<地域>.aliyuncs.com -u "<ACR_USERNAME>"
docker pull hello-world
docker tag hello-world registry.cn-<地域>.aliyuncs.com/yvan-2000/zhangyuan.net:test-push
docker push registry.cn-<地域>.aliyuncs.com/yvan-2000/zhangyuan.net:test-push
```

---

## 安全建议

- **`ECS_SSH_PASSWORD`** 与服务器登录密码等效，定期更换，并限制 `sshd` 仅必要用户可密码登录。  
- 生产密钥只放在服务器文件与 GitHub Secrets，勿提交仓库。  
- ACR 拉取/推送账号可按需拆分最小权限。
