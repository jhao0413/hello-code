import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';
import { agentSessionRoutes } from './routes/agent-sessions.js';
import { agentRequestRoutes } from './routes/agent-requests.js';
import { agentRoutes } from './routes/agents.js';
import { apiKeyRoutes } from './routes/api-keys.js';
import { authRoutes } from './routes/auth.js';
import { chatRoutes } from './routes/chat.js';
import { conversationRoutes } from './routes/conversations.js';
import { userRoutes } from './routes/users.js';

const app = new Elysia()
	.use(cors())
	.use(authRoutes)
	.use(apiKeyRoutes)
	.use(chatRoutes)
	.use(agentRoutes)
	.use(conversationRoutes)
	.use(agentSessionRoutes)
	.use(agentRequestRoutes)
	.use(userRoutes)
	.get('/api/health', () => ({
		status: 'ok',
		timestamp: new Date().toISOString(),
	}))
	.listen(process.env.PORT || 4000);

console.log(`🦊 Server is running at http://localhost:${app.server?.port}`);

export type App = typeof app;
