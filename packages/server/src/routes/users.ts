import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma.js';
import { createAuthError } from '../middleware/auth.js';

export const userRoutes = new Elysia({ prefix: '/api/users' })
	.patch(
		'/profile',
		async ({ user, body, set }) => {
			if (!user) {
				set.status = 401;
				return createAuthError('请先登录');
			}

			const { name, image } = body as { name?: string; image?: string };

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
			body: t.Object({
				name: t.Optional(t.String()),
				image: t.Optional(t.String()),
			}),
		},
	)
	.get(
		'/stats',
		async ({ user, set }) => {
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
		},
	);
