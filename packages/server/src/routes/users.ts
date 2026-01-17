import { Elysia, t, type Static } from 'elysia';
import prisma from '../lib/prisma.js';
import { authMiddleware, createAuthError, withAuth } from '../middleware/auth.js';

const profileBodySchema = t.Object({
	name: t.Optional(t.String()),
	image: t.Optional(t.String()),
});

type ProfileBody = Static<typeof profileBodySchema>;

export const userRoutes = new Elysia({ prefix: '/api/users' })
	.use(authMiddleware)
	.patch(
		'/profile',
		async (ctx) => {
			const { user, set } = withAuth(ctx);
			if (!user) {
				set.status = 401;
				return createAuthError('请先登录');
			}

			const { name, image } = ctx.body as ProfileBody;

			const updatedUser = await prisma.user.update({
				where: { id: user.userId },
				data: {
					name,
					image,
				},
				select: {
					id: true,
					email: true,
					name: true,
					image: true,
					created_at: true,
				},
			});

			return { user: updatedUser };
		},
		{
			body: profileBodySchema,
		},
	)
	.get('/stats', async (ctx) => {
		const { user, set } = withAuth(ctx);
		if (!user) {
			set.status = 401;
			return createAuthError('请先登录');
		}

		const [agentCount, conversationCount, sessionCount] = await Promise.all([
			prisma.agent.count({ where: { userId: user.userId } }),
			prisma.conversation.count({ where: { userId: user.userId } }),
			prisma.agentSession.count({ where: { userId: user.userId } }),
		]);

		return {
			stats: {
				agents: agentCount,
				conversations: conversationCount,
				sessions: sessionCount,
			},
		};
	});
