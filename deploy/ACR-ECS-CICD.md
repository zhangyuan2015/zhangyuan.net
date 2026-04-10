# 阿里云 ACR + ECS 自动部署说明

本文档对应仓库里的 GitHub Actions 文件：`.github/workflows/acr-ecs-deploy.yml`。

目标流程：

1. 推送 `main` 分支
2. GitHub Actions 先构建并推送后端镜像到 ACR
3. 再构建并推送前端镜像到 ACR
4. 通过 SSH 登录 ECS，按后端 -> 前端顺序拉取并重启容器

---

## 1. 前置准备

### 1.1 阿里云 ACR 准备

在 ACR（个人版或企业版）创建命名空间，例如：`zhangyuan`。

建议提前创建两个仓库：

- `zhangyuan-backend`
- `zhangyuan-frontend`

记录 ACR 信息（后续写入 GitHub Secrets）：

- Registry 地址，例如：`registry.cn-hangzhou.aliyuncs.com`
- ACR 登录用户名
- ACR 登录密码/令牌

### 1.2 ECS 准备

ECS 需安装：

- Docker
- Docker Compose 插件（`docker compose version` 可用）

并准备部署目录：

```bash
sudo mkdir -p /opt/zhangyuan-net/deploy
```

把仓库中的 `deploy/docker-compose.prod.yml` 放到 ECS：

```bash
scp deploy/docker-compose.prod.yml <ecs-user>@<ecs-host>:/opt/zhangyuan-net/deploy/docker-compose.prod.yml
```

后端运行需要 `backend/.env.production`，也需要放到 ECS：

```bash
sudo mkdir -p /opt/zhangyuan-net/backend
scp backend/.env.production <ecs-user>@<ecs-host>:/opt/zhangyuan-net/backend/.env.production
```

> 强烈建议：线上环境变量不要直接复用仓库中的示例，改为 ECS 手工维护，并定期轮转密钥。

### 1.3 域名与反向代理（可选但推荐）

当前 compose 把前端容器映射到 `80:3000`。  
若你有 Nginx/Caddy，可改为仅监听 `127.0.0.1`，再由代理层接管 HTTPS 证书和转发。

---

## 2. 配置 GitHub Secrets

GitHub 仓库路径：`Settings -> Secrets and variables -> Actions`，新增：

### 2.1 ACR 相关（账号密码登录）

- `ACR_REGISTRY`：如 `registry.cn-hangzhou.aliyuncs.com`
- `ACR_NAMESPACE`：如 `zhangyuan`
- `ACR_USERNAME`：ACR 登录用户名（账号）
- `ACR_PASSWORD`：ACR 登录密码

### 2.2 ECS 相关

- `ECS_HOST`：ECS 公网 IP
- `ECS_USER`：SSH 用户
- `ECS_PORT`：SSH 端口（通常 `22`）
- `ECS_SSH_KEY`：用于登录 ECS 的私钥内容（多行原文）

### 2.3 前端 API 地址相关

- `FRONTEND_API_BASE_URL`：前端服务端请求 API 的地址（建议内网/同机地址）
  - 示例：`http://backend:8000/api/v1`
- `NEXT_PUBLIC_API_BASE_URL`：浏览器侧访问 API 的公开地址
  - 示例：`https://zhangyuan.net/api/v1`

---

## 3. 工作流行为说明

`acr-ecs-deploy.yml` 做了以下事情：

1. 使用账号密码登录 ACR
2. 构建并推送后端镜像（tag：`${GITHUB_SHA}` 与 `latest`）
3. 构建并推送前端镜像（tag：`${GITHUB_SHA}` 与 `latest`）
4. SSH 到 ECS，在 `/opt/zhangyuan-net/deploy` 生成 `.env.images`
5. 按顺序部署：
   - `pull backend` + `up -d backend`
   - `pull frontend` + `up -d frontend`

这保证了你要求的顺序：先后端，再前端。

---

## 4. 手动触发与回滚

### 4.1 手动触发

在 GitHub `Actions` 页面手动运行 `Build And Deploy To ACR/ECS`（`workflow_dispatch`）。

### 4.2 回滚（按镜像 tag）

在 ECS 编辑 `/opt/zhangyuan-net/deploy/.env.images`，把：

- `BACKEND_IMAGE=...:<old_sha>`
- `FRONTEND_IMAGE=...:<old_sha>`

然后执行：

```bash
cd /opt/zhangyuan-net/deploy
docker compose --env-file .env.images -f docker-compose.prod.yml pull
docker compose --env-file .env.images -f docker-compose.prod.yml up -d
```

---

## 5. 常见问题排查

- 镜像推送失败：确认 `ACR_REGISTRY/ACR_NAMESPACE/ACR_USERNAME/ACR_PASSWORD` 是否正确。
- ECS 拉取失败：在 ECS 手工执行下方命令验证账号密码。

```bash
echo "<ACR_PASSWORD>" | docker login <ACR_REGISTRY> --username "<ACR_USERNAME>" --password-stdin
```
- 前端请求 API 失败：检查 `FRONTEND_API_BASE_URL` 和 `NEXT_PUBLIC_API_BASE_URL` 是否符合当前网络拓扑。
- SSH 失败：确认安全组放行端口、`ECS_SSH_KEY` 与 `ECS_USER` 匹配。

---

## 6. 安全建议（务必执行）

- 立即轮换已暴露的数据库、对象存储、JWT 等敏感凭据。
- 所有生产密钥只保存在 ECS 与 GitHub Secrets，不要提交到仓库。
- ACR 建议使用最小权限账号（推送专用 / 拉取专用分离）。
