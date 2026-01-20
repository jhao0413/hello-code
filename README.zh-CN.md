# Hello Code - AI 智能体控制台

一个用于管理和交互 AI 代码智能体的全栈应用。

[English](./README.md) | 简体中文

## 技术栈

### 前端
- **React 18** - UI 框架
- **Vite 6** - 构建工具
- **HeroUI** - 组件库（基于 TailwindCSS 3.x）
- **Ant Design 6** - UI 组件库
- **@ant-design/x** - AI 交互组件
- **@antv/infographic** - 信息图生成
- **Vercel AI SDK** - AI 流式传输 hooks
- **React Router 7** - 路由
- **Framer Motion** - 动画

### 后端
- **Bun** - 运行时
- **Elysia** - Web 框架
- **Prisma** - ORM
- **PostgreSQL** - 数据库
- **Vercel AI SDK** - AI 模型集成（Anthropic, OpenAI, DeepSeek）
- **Zod** - Schema 验证

## 功能特性

- 🤖 多智能体管理，支持自定义系统提示词
- 💬 实时流式聊天界面
- 📊 智能体会话跟踪与分析
- 📝 对话历史和消息持久化
- 🎨 信息图生成能力
- 🔧 支持多种 AI 模型（Claude、GPT、DeepSeek）
- 📈 Token 使用量和性能指标

## 项目结构

```
hello-code/
├── packages/
│   ├── web/                      # 前端 React 应用
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Layout.tsx
│   │   │   │   └── InfographicRenderer.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Agents.tsx
│   │   │   │   └── Chat.tsx
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── styles/
│   │   └── ...
│   ├── server/                   # 后端 Elysia 应用
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── agents.ts
│   │   │   │   ├── conversations.ts
│   │   │   │   ├── chat.ts
│   │   │   │   └── agent-sessions.ts
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   ├── lib/
│   │   │   │   └── prisma.ts
│   │   │   └── index.ts
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   └── neovate-code/             # Neovate Code 分支（二次开发）
│       └── (Fork from neovateai/neovate-code)
└── package.json                  # Workspace 根目录
```

## 数据库模型

应用使用以下数据模型：

- **User** - 用户账户和认证
- **Agent** - AI 智能体，可配置提示词和模型
- **Conversation** - 关联到智能体的聊天对话
- **Message** - 对话中的单条消息
- **AgentSession** - 会话跟踪与分析（tokens、时长、使用的语言）

## 快速开始

### 前置要求
- Bun >= 1.0
- PostgreSQL

### 安装

1. 克隆仓库：
```bash
git clone --recurse-submodules <repository-url>
cd hello-code
```

2. 安装依赖：
```bash
bun install
```

3. 配置环境变量：
```bash
# 复制示例环境变量文件
cp packages/server/.env.example packages/server/.env

# 编辑 .env 文件，填入你的配置
```

4. 设置数据库：
```bash
bun run db:push
```

5. 启动开发服务器：
```bash
bun run dev
```

这将启动：
- 前端：http://localhost:3000
- 后端：http://localhost:4000

## 可用脚本

### 开发
- `bun run dev` - 同时启动前端和后端开发模式
- `bun run dev:web` - 仅启动前端
- `bun run dev:server` - 仅启动后端

### 构建
- `bun run build` - 构建所有包
- `bun run build:web` - 仅构建前端
- `bun run build:server` - 仅构建后端

### 数据库
- `bun run db:push` - 将 schema 推送到数据库（开发环境）
- `bun run db:migrate` - 运行数据库迁移
- `bun run db:generate` - 生成 Prisma 客户端
- `bun run db:studio` - 打开 Prisma Studio（数据库 GUI）

### 代码质量
- `bun run lint` - 对所有包执行 lint 检查
- `bun run format` - 使用 Biome 格式化代码

## 环境变量

### 服务端 (.env)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/hello_code
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
PORT=4000
NODE_ENV=development
```

## API 路由

### Agents（智能体）
- `GET /api/agents` - 列出所有智能体
- `POST /api/agents` - 创建新智能体
- `GET /api/agents/:id` - 获取智能体详情
- `PUT /api/agents/:id` - 更新智能体
- `DELETE /api/agents/:id` - 删除智能体

### Conversations（对话）
- `GET /api/conversations` - 列出对话
- `POST /api/conversations` - 创建对话
- `GET /api/conversations/:id` - 获取对话详情
- `DELETE /api/conversations/:id` - 删除对话

### Chat（聊天）
- `POST /api/chat` - 发送消息并流式返回响应

### Agent Sessions（智能体会话）
- `GET /api/agent-sessions` - 列出智能体会话
- `POST /api/agent-sessions` - 创建会话记录

## 支持的 AI 模型

- Anthropic Claude (claude-3-sonnet, claude-3-opus, claude-3-haiku)
- OpenAI GPT (gpt-4, gpt-4-turbo, gpt-3.5-turbo)
- DeepSeek (deepseek-chat, deepseek-coder)

## Neovate Code 二次开发

本项目在 `packages/neovate-code/` 中包含了 [neovateai/neovate-code](https://github.com/neovateai/neovate-code) 的 Fork 版本，作为 Git submodule 进行自定义开发。

### 初始设置

克隆本仓库时，初始化 submodules：

```bash
# 克隆时包含 submodules
git clone --recurse-submodules <repository-url>

# 或者如果已经克隆，初始化 submodules
git submodule update --init --recursive
```

### Git 配置

neovate-code submodule 配置了双 remote：
- **origin**：你的 Fork 仓库 `git@github.com:jhao0413/neovate-code.git`（用于自定义修改）
- **upstream**：原始仓库 `git@github.com:neovateai/neovate-code.git`（用于同步更新）

### 同步上游更新

从原始仓库拉取最新更改：

```bash
cd packages/neovate-code

# 从原始仓库获取更新
git fetch upstream

# 合并到本地分支
git merge upstream/main

# 推送到你的 Fork
git push origin main

# 在主仓库中更新 submodule 引用
cd ../..
git add packages/neovate-code
git commit -m "chore: update neovate-code submodule"
```

### 自定义开发工作流

1. **创建功能分支**：
```bash
cd packages/neovate-code
git checkout -b feat/your-feature
```

2. **进行修改并提交**：
```bash
git add .
git commit -m "feat: your changes"
```

3. **推送到你的 Fork**：
```bash
git push origin feat/your-feature
```

4. **更新主仓库以引用你的更改**：
```bash
cd ../..
git add packages/neovate-code
git commit -m "chore: update neovate-code to latest"
```

### 拉取最新的 Submodule 更改

当其他团队成员更新了 submodule：

```bash
# 拉取主仓库的更改
git pull

# 更新 submodules 以匹配引用的 commit
git submodule update --remote --merge
```

### 贡献回上游

如果你的更改对原始项目有价值，可以从你的 Fork（`jhao0413/neovate-code`）向原始仓库（`neovateai/neovate-code`）创建 Pull Request。

## 许可证

MIT
