# Hello Code - AI Agent Dashboard

A full-stack application for managing and interacting with AI code agents.

English | [简体中文](./README.zh-CN.md)

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite 6** - Build tool
- **HeroUI** - Component library (with TailwindCSS 3.x)
- **Ant Design 6** - UI component library
- **@ant-design/x** - AI interaction components
- **@antv/infographic** - Infographic generation
- **Vercel AI SDK** - AI streaming hooks
- **React Router 7** - Routing
- **Framer Motion** - Animations

### Backend
- **Bun** - Runtime
- **Elysia** - Web framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **Vercel AI SDK** - AI model integration (Anthropic, OpenAI, DeepSeek)
- **Zod** - Schema validation

## Features

- 🤖 Multi-agent management with configurable system prompts
- 💬 Real-time streaming chat interface
- 📊 Agent session tracking with analytics
- 📝 Conversation history with message persistence
- 🎨 Infographic generation capabilities
- 🔧 Support for multiple AI models (Claude, GPT, DeepSeek)
- 📈 Token usage and performance metrics

## Project Structure

```
hello-code/
├── packages/
│   ├── web/                      # Frontend React application
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
│   ├── server/                   # Backend Elysia application
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
│   ├── neovate-code/             # Neovate Code fork (二次开发)
│   │   └── (Fork from neovateai/neovate-code)
│   └── hello-agent/              # Custom Neovate-based agent (插件式扩展)
│       ├── src/
│       │   ├── index.ts          # Entry point
│       │   ├── plugins/          # Custom plugins
│       │   ├── agents/           # Custom agents
│       │   └── tools/            # Custom tools
│       └── package.json
└── package.json                  # Workspace root
```

## Database Schema

The application uses the following data models:

- **User** - User accounts and authentication
- **Agent** - AI agents with configurable prompts and models
- **Conversation** - Chat conversations linked to agents
- **Message** - Individual messages in conversations
- **AgentSession** - Session tracking with analytics (tokens, duration, languages used)

## Getting Started

### Prerequisites
- Bun >= 1.0
- PostgreSQL

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hello-code
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
# Copy the example env file
cp packages/server/.env.example packages/server/.env

# Edit the .env file with your configuration
```

4. Set up the database:
```bash
bun run db:push
```

5. Start development servers:
```bash
bun run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Available Scripts

### Development
- `bun run dev` - Start both frontend and backend in development mode
- `bun run dev:web` - Start frontend only
- `bun run dev:server` - Start backend only
- `bun run dev:agent` - Start custom agent (hello-agent)

### Build
- `bun run build` - Build both packages
- `bun run build:web` - Build frontend only
- `bun run build:server` - Build backend only
- `bun run build:agent` - Build custom agent

### Database
- `bun run db:push` - Push schema to database (development)
- `bun run db:migrate` - Run database migrations
- `bun run db:generate` - Generate Prisma client
- `bun run db:studio` - Open Prisma Studio (database GUI)

### Code Quality
- `bun run lint` - Run linting for both packages
- `bun run format` - Format code with Biome

## Environment Variables

### Server (.env)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/hello_code
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
PORT=4000
NODE_ENV=development
```

## API Routes

### Agents
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create a new agent
- `GET /api/agents/:id` - Get agent details
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id` - Get conversation details
- `DELETE /api/conversations/:id` - Delete conversation

### Chat
- `POST /api/chat` - Send message and stream response

### Agent Sessions
- `GET /api/agent-sessions` - List agent sessions
- `POST /api/agent-sessions` - Create session record

## Supported AI Models

- Anthropic Claude (claude-3-sonnet, claude-3-opus, claude-3-haiku)
- OpenAI GPT (gpt-4, gpt-4-turbo, gpt-3.5-turbo)
- DeepSeek (deepseek-chat, deepseek-coder)

## Neovate Code Development

This project includes a fork of [neovateai/neovate-code](https://github.com/neovateai/neovate-code) in `packages/neovate-code/` as a Git submodule for custom development.

### Hello Agent (Recommended)

For most customizations, use the **hello-agent** package which provides a plugin-based extension system without modifying the upstream code.

#### Development (Local Workspace)

In local development, hello-agent uses the local neovate-code workspace:

```bash
# Start development
bun run dev:agent
```

The `package.json` uses `"@neovate/code": "workspace:*"` to reference the local package.

#### Publishing to npm

When publishing hello-agent to npm, update the dependency:

```json
{
  "dependencies": {
    "@neovate/code": ">=0.25.0"  // Use published version instead of workspace:*
  }
}
```

Then build and publish:

```bash
bun run build
cd packages/hello-agent
bun publish
```

Users can then install and use your agent:

```bash
npx hello-agent
```

#### Plugin Extension Points

| Hook | Purpose |
|------|---------|
| `config` | Modify default configuration (model, systemPrompt, etc.) |
| `provider` | Add custom LLM providers |
| `tool` | Add custom tools |
| `slashCommand` | Add slash commands |
| `agent` | Add custom agents |
| `systemPrompt` | Modify system prompt |
| `toolResult` | Process tool results |

#### Directory Structure

```
packages/hello-agent/
├── src/
│   ├── index.ts              # Entry point using runNeovate()
│   ├── plugins/              # Custom plugins
│   │   └── my-plugin.ts
│   ├── agents/               # Custom agent definitions
│   │   └── index.ts
│   └── tools/                # Custom tools
│       └── index.ts
└── package.json
```

#### Example Plugin

```typescript
import type { Plugin } from '@neovate/code';

export const myPlugin: Plugin = {
  name: 'my-plugin',
  
  config({ config, argvConfig }) {
    return {
      model: argvConfig.model || config.model || 'claude-sonnet-4-5',
    };
  },

  tool: async (opts) => {
    return [{
      name: 'my_custom_tool',
      description: 'A custom tool',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Input' }
        },
        required: ['input']
      }
    }];
  },

  slashCommand: async () => [],

  agent: async () => [],
};
```

Then pass it to `runNeovate()`:

```typescript
import { runNeovate } from '@neovate/code';
import { myPlugin } from './plugins/my-plugin';

runNeovate({
  productName: 'My Agent',
  version: '1.0.0',
  plugins: [myPlugin],
}).catch(console.error);
```

### Direct Neovate Code Modification

### Direct Neovate Code Modification

Only modify `packages/neovate-code/` when the plugin system doesn't expose the required functionality.

### Initial Setup

When cloning this repository, initialize the submodules:

```bash
# Clone with submodules
git clone --recurse-submodules <repository-url>

# Or if already cloned, initialize submodules
git submodule update --init --recursive
```

### Git Configuration

The neovate-code submodule is configured with dual remotes:
- **origin**: Your fork at `git@github.com:jhao0413/neovate-code.git` (for custom changes)
- **upstream**: Original repository at `git@github.com:neovateai/neovate-code.git` (for syncing updates)

### Syncing with Upstream

To pull the latest changes from the original repository:

```bash
cd packages/neovate-code

# Fetch updates from original repository
git fetch upstream

# Merge into your local branch
git merge upstream/main

# Push to your fork
git push origin main

# Update the submodule reference in the main repository
cd ../..
git add packages/neovate-code
git commit -m "chore: update neovate-code submodule"
```

### Custom Development Workflow

1. **Create a feature branch**:
```bash
cd packages/neovate-code
git checkout -b feat/your-feature
```

2. **Make your changes and commit**:
```bash
git add .
git commit -m "feat: your changes"
```

3. **Push to your fork**:
```bash
git push origin feat/your-feature
```

4. **Update main repository to reference your changes**:
```bash
cd ../..
git add packages/neovate-code
git commit -m "chore: update neovate-code to latest"
```

### Pulling Latest Submodule Changes

When other team members update the submodule:

```bash
# Pull main repository changes
git pull

# Update submodules to match the referenced commit
git submodule update --remote --merge
```

### Contributing Back to Upstream

If your changes would benefit the original project, you can create a Pull Request from your fork (`jhao0413/neovate-code`) to the original repository (`neovateai/neovate-code`).

## License

MIT
