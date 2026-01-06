import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';
import { agentSessionRoutes } from './routes/agent-sessions.js';
import { agentRoutes } from './routes/agents.js';
import { chatRoutes } from './routes/chat.js';
import { conversationRoutes } from './routes/conversations.js';

const app = new Elysia()
	.use(cors())
	.use(chatRoutes)
	.use(agentRoutes)
	.use(conversationRoutes)
	.use(agentSessionRoutes)
	.get('/api/health', () => ({
		status: 'ok',
		timestamp: new Date().toISOString(),
	}))
	.listen(process.env.PORT || 4000);

console.log(`🦊 Server is running at http://localhost:${app.server?.port}`);

export type App = typeof app;
