# 🗺️ Travel Record Map

一个基于 Nuxt 3 的旅行记录地图应用，让您轻松记录和管理旅行足迹。

## ✨ 功能特性

- 📍 **地点管理** - 创建和管理旅行地点
- 📝 **日志记录** - 为每个地点添加详细的旅行日志
- 🖼️ **图片上传** - 支持多图片上传和管理
- 🗺️ **交互地图** - 基于 MapLibre 的交互式地图展示
- 🔐 **用户认证** - GitHub OAuth 登录
- 📱 **响应式设计** - 支持桌面和移动设备
- 🌙 **主题切换** - 支持明暗主题切换

## 🛠️ 技术栈

- **前端框架**: [Nuxt 3](https://nuxt.com/) + Vue 3 + TypeScript
- **样式**: [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- **地图**: [MapLibre GL JS](https://maplibre.org/)
- **数据库**: [Turso](https://turso.tech/) (SQLite) + [Drizzle ORM](https://orm.drizzle.team/)
- **认证**: [Better Auth](https://www.better-auth.com/)
- **存储**: S3 兼容存储 (MinIO/Tigris/Cloudflare R2/AWS S3)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **表单验证**: [VeeValidate](https://vee-validate.logaretm.com/) + [Zod](https://zod.dev/)

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- Yarn 或 npm
- Git

### 1. 克隆项目

```bash
git clone <repository-url>
cd travel-record-map
```

### 2. 安装依赖

```bash
yarn install
# 或
npm install
```

### 3. 环境配置

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下必要变量：

```bash
# 数据库配置 (本地开发)
TURSO_DATABASE_URL=http://127.0.0.1:8080
TURSO_AUTH_TOKEN=

# Better Auth 配置
BETTER_AUTH_SECRET=your-32-byte-random-secret-here
BETTER_AUTH_URL=http://localhost:3000

# GitHub OAuth 配置
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# MinIO 本地存储配置
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=images
S3_REGION=us-east-1
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
```

### 4. 配置本地数据库

启动本地 Turso 数据库：

```bash
yarn dev:db
```

### 5. 配置 MinIO (图片存储)

#### 安装 MinIO

```bash
# macOS
brew install minio/stable/minio minio/stable/mc

# Linux/Windows
# 参考官方文档: https://min.io/docs/minio/linux/index.html
```

#### 一键配置（推荐）

```bash
# 运行一键初始化脚本
./scripts/init-minio.sh
```

#### 手动配置

```bash
# 1. 启动 MinIO
./scripts/start-minio.sh

# 2. 在新终端运行配置脚本
./scripts/setup-minio-simple.sh
```

### 6. 启动开发服务器

```bash
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用！

## 📝 可用脚本

```bash
# 开发
yarn dev              # 启动开发服务器
yarn dev:db           # 启动本地数据库

# 构建
yarn build            # 构建生产版本
yarn preview          # 预览生产构建
yarn generate         # 生成静态站点

# 代码质量
yarn lint             # 运行 ESLint
yarn lint:fix         # 自动修复 ESLint 错误
yarn typecheck        # TypeScript 类型检查

# 存储验证
yarn verify:tigris    # 验证 Tigris 配置
yarn verify:r2        # 验证 Cloudflare R2 配置
yarn setup:tigris-cors # 配置 Tigris CORS
```

## 🚀 生产部署

### 推荐方案：Vercel + Tigris

本项目推荐使用 [Vercel](https://vercel.com/) 部署应用，[Tigris](https://www.tigrisdata.com/) 作为对象存储（免费 5GB）。

#### 1. 准备 Tigris 存储

1. 访问 [Tigris Console](https://console.tigris.dev/) 创建账户
2. 创建新的 bucket 并获取访问凭证
3. **重要**: 配置 CORS（必须步骤）

```bash
# 设置环境变量
export S3_BUCKET=your-tigris-bucket-name
export S3_ENDPOINT=https://fly.storage.tigris.dev
export S3_ACCESS_KEY=tid_your_access_key
export S3_SECRET_KEY=tsec_your_secret_key

# 运行 CORS 配置脚本
yarn setup:tigris-cors
```

#### 2. 准备 Turso 数据库

1. 访问 [Turso Console](https://turso.tech/) 创建数据库
2. 获取数据库 URL 和认证令牌

#### 3. 配置 GitHub OAuth

1. 在 GitHub 创建 OAuth 应用
2. 设置回调 URL: `https://your-domain.com/api/auth/callback/github`

#### 4. 部署到 Vercel

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量：

```bash
# 数据库
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# 认证
BETTER_AUTH_SECRET=your-production-secret
BETTER_AUTH_URL=https://your-domain.com
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# 存储
S3_ENDPOINT=https://fly.storage.tigris.dev
S3_BUCKET=your-tigris-bucket-name
S3_REGION=auto
S3_ACCESS_KEY=tid_your_tigris_access_key
S3_SECRET_KEY=tsec_your_tigris_secret_key
```

3. 部署应用

### 其他部署选项

#### Cloudflare R2

```bash
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_BUCKET=your-r2-bucket-name
S3_REGION=auto
S3_ACCESS_KEY=your-r2-access-key
S3_SECRET_KEY=your-r2-secret-key
```

#### AWS S3

```bash
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=your-production-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY=your-aws-access-key
S3_SECRET_KEY=your-aws-secret-key
```

## 📁 项目结构

```
travel-record-map/
├── app/                    # 应用源码
│   ├── components/         # Vue 组件
│   ├── composables/        # 组合式函数
│   ├── layouts/           # 布局组件
│   ├── lib/               # 工具库
│   │   ├── db/            # 数据库相关
│   │   │   ├── schema/    # 数据库模式
│   │   │   ├── queries/   # 查询函数
│   │   │   └── migrations/ # 数据库迁移
│   │   └── ...
│   ├── pages/             # 页面路由
│   └── assets/            # 静态资源
├── server/                # 服务端 API
├── stores/                # Pinia 状态管理
├── scripts/               # 工具脚本
└── ...
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [Nuxt 3 文档](https://nuxt.com/docs)
- [Turso 文档](https://docs.turso.tech/)
- [Better Auth 文档](https://www.better-auth.com/docs)
- [MapLibre 文档](https://maplibre.org/maplibre-gl-js-docs/)
- [Tigris 文档](https://www.tigrisdata.com/docs/)

## ❓ 常见问题

### 图片上传失败

确保已正确配置 CORS 设置。对于 Tigris，运行：
```bash
yarn setup:tigris-cors
```

### 数据库连接错误

检查 `TURSO_DATABASE_URL` 和 `TURSO_AUTH_TOKEN` 是否正确配置。

### GitHub OAuth 登录失败

确认 GitHub OAuth 应用的回调 URL 设置正确，并检查客户端 ID 和密钥。

---

如有问题或建议，欢迎提交 [Issue](../../issues) 或 [Pull Request](../../pulls)！
