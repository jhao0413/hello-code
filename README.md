# Hello Code - AI Agent Dashboard

A full-stack application for managing and interacting with AI code agents.

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
│   └── server/                   # Backend Elysia application
│       ├── src/
│       │   ├── routes/
│       │   │   ├── agents.ts
│       │   │   ├── conversations.ts
│       │   │   ├── chat.ts
│       │   │   └── agent-sessions.ts
│       │   ├── services/
│       │   ├── middleware/
│       │   ├── lib/
│       │   │   └── prisma.ts
│       │   └── index.ts
│       └── prisma/
│           ├── schema.prisma
│           └── migrations/
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

### Build
- `bun run build` - Build both packages
- `bun run build:web` - Build frontend only
- `bun run build:server` - Build backend only

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

## License

MIT
