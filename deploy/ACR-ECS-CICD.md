# 阿里云 ACR 构建推送与后续 ECS 部署

本文档对应 GitHub Actions：`.github/workflows/acr-ecs-deploy.yml`。

---

## 镜像仓库约定（一个仓库，两套 tag）

ACR 中只使用 **一个镜像仓库**：`zhangyuan.net`。命名空间在 workflow 里写死为 **`yvan-2000`**，完整路径为：`<ACR_REGISTRY>/yvan-2000/zhangyuan.net`。

前后端通过 **tag 前缀** 区分：

| 用途 | tag 规则 | 说明 |
|------|----------|------|
| 后端 | `b_<commit sha>`、`b_latest` | 每次构建先推后端 |
| 前端 | `f_<commit sha>`、`f_latest` | 再推前端 |

示例（请替换为你的 registry 与真实 sha）：

- 后端：`registry.cn-hangzhou.aliyuncs.com/yvan-2000/zhangyuan.net:b_abc123def...`
- 前端：`registry.cn-hangzhou.aliyuncs.com/yvan-2000/zhangyuan.net:f_abc123def...`

---

## 当前阶段（已启用）：仅构建并推送到 ACR

目标：先验证镜像能成功构建并出现在 ACR 中，**不连接 ECS、不自动部署**。

流程：

1. 推送 `main` 分支，或在 GitHub `Actions` 里手动运行 **Build And Push To ACR**
2. 使用账号密码登录 ACR
3. **先**构建并推送后端（tag：`b_${GITHUB_SHA}`、`b_latest`）
4. **再**构建并推送前端（tag：`f_${GITHUB_SHA}`、`f_latest`）

### 需要的 GitHub Secrets（仅此阶段）

在 `Settings -> Secrets and variables -> Actions` 配置：

| Secret | 说明 |
|--------|------|
| `ACR_REGISTRY` | 如 `registry.cn-hangzhou.aliyuncs.com` |
| `ACR_USERNAME` | ACR 登录用户名 |
| `ACR_PASSWORD` | ACR 登录密码 |

命名空间 **`yvan-2000`** 已在 workflow 中固定，无需再配 Secret。

在 ACR 控制台命名空间 **`yvan-2000`** 下需已创建仓库 **`zhangyuan.net`**（与 workflow 里 `ACR_REPOSITORY` 一致）。

### 在 ACR 控制台核对

进入仓库 `zhangyuan.net`，应能看到 `b_*`、`f_*` 两类 tag（含本次 commit 的 sha 与 `b_latest` / `f_latest`）。

---

## 后续阶段（待你确认镜像 OK 后）：ECS 手工或自动部署

以下内容为上线 ECS 时参考；**当前 workflow 不包含 SSH 部署**。

### ECS 前置

- 安装 Docker 与 Docker Compose 插件
- 目录示例：`/opt/zhangyuan-net/deploy`、`/opt/zhangyuan-net/backend`
- 将 `deploy/docker-compose.prod.yml` 放到 ECS 的 `deploy` 目录
- 将 `backend/.env.production` 放到 ECS（勿提交到仓库）

### 手工拉取镜像（账号密码登录）

```bash
echo "<ACR_PASSWORD>" | docker login <ACR_REGISTRY> --username "<ACR_USERNAME>" --password-stdin
```

在 ECS 上编辑 `/opt/zhangyuan-net/deploy/.env.images`：**同一仓库，不同 tag**（建议生产用 `b_<sha>` / `f_<sha>` 便于回滚）：

```env
BACKEND_IMAGE=registry.cn-hangzhou.aliyuncs.com/yvan-2000/zhangyuan.net:b_<sha>
FRONTEND_IMAGE=registry.cn-hangzhou.aliyuncs.com/yvan-2000/zhangyuan.net:f_<sha>
FRONTEND_API_BASE_URL=http://backend:8000/api/v1
NEXT_PUBLIC_API_BASE_URL=https://你的域名/api/v1
```

若临时想跟 CI 最新构建一致，也可使用 `b_latest` / `f_latest`（回滚不如 sha 清晰）。

然后：

```bash
cd /opt/zhangyuan-net/deploy
docker compose --env-file .env.images -f docker-compose.prod.yml pull backend
docker compose --env-file .env.images -f docker-compose.prod.yml up -d backend
docker compose --env-file .env.images -f docker-compose.prod.yml pull frontend
docker compose --env-file .env.images -f docker-compose.prod.yml up -d frontend
```

### 将来若要恢复「推送后自动部署」

在 workflow 中增加 SSH 步骤（或单独新建 `ecs-deploy.yml`），并配置 Secrets：`ECS_HOST`、`ECS_USER`、`ECS_PORT`、`ECS_SSH_KEY`，以及前端的 `FRONTEND_API_BASE_URL`、`NEXT_PUBLIC_API_BASE_URL`。部署时写入的 `BACKEND_IMAGE` / `FRONTEND_IMAGE` 需带 `b_` / `f_` tag。

---

## 常见问题

- **推送失败**：检查 `ACR_REGISTRY`、用户名密码；确认 ACR 命名空间 **`yvan-2000`** 下已创建仓库 **`zhangyuan.net`**。
- **构建失败**：查看 Actions 日志中 `docker build` 报错；本地可用相同命令在 `backend/`、`frontend/` 目录验证。

### 推送报错 `denied: requested access to the resource is denied`

说明 Docker 已连上该 registry，但**当前登录身份没有权限**向 `…/yvan-2000/zhangyuan.net` 推送，或**镜像地址与实例/地域不一致**。按下面逐项核对。

1. **`ACR_REGISTRY` 必须与本实例地域一致**  
   个人版常见为：`registry.cn-hangzhou.aliyuncs.com`、`registry.cn-beijing.aliyuncs.com` 等。在 ACR 控制台实例概览里看「公网地址」，Secret 里填**与控制台完全一致**的域名（不要带 `https://`，workflow 会自动去掉；也不要多写尾部 `/`）。

2. **登录用户名一般不是命名空间 `yvan-2000`**  
   个人版常见为：**阿里云主账号登录名**（控制台显示的账号名，常为邮箱），或 **RAM 子账号的用户名**；密码多为在 ACR 里设置的 **镜像仓库独立密码**（或控制台「访问凭证 / 登录 Docker」里提示的方式）。  
   不要用命名空间当 `ACR_USERNAME`，除非控制台明确说明如此。

3. **命名空间必须属于当前登录账号**  
   若 `yvan-2000` 是别的账号下的命名空间，或 RAM 用户未被授权该命名空间，会表现为 `denied`。

4. **先在控制台创建镜像仓库**  
   在命名空间 **`yvan-2000`** 下创建仓库 **`zhangyuan.net`**（名称与 workflow 里 `ACR_REPOSITORY` 一致），再推送。部分环境未建仓库时也会拒绝。

5. **RAM 子账号权限**  
   若用 RAM 用户，需具备容器镜像服务相关权限（例如 `AliyunContainerRegistryFullAccess`，或包含对目标命名空间推送的自定义策略）。

6. **本地复现（推荐）**  
   在本机执行（把值换成你的）：

   ```bash
   docker login registry.cn-<地域>.aliyuncs.com -u "<ACR_USERNAME>" 
   # 输入 ACR_PASSWORD
   docker pull hello-world
   docker tag hello-world registry.cn-<地域>.aliyuncs.com/yvan-2000/zhangyuan.net:test-push
   docker push registry.cn-<地域>.aliyuncs.com/yvan-2000/zhangyuan.net:test-push
   ```

   若本地同样 `denied`，问题在**账号/密码/权限/地域/仓库是否存在**，与 GitHub Actions 无关；本地能推、CI 不能推，再对比 Secrets 是否与本地一致（无空格、无复制错行）。

---

## 安全建议

- 生产环境变量与数据库密码仅放在 ECS 与 GitHub Secrets，不要写入仓库。
- ACR 可使用仅推送/仅拉取权限的子账号，与 ECS 拉取账号分离。
