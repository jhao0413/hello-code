import { Elysia, t, type Static } from 'elysia';
import prisma from '../lib/prisma.js';
import { type AccessPayload } from '../lib/auth.js';
import { createAuthError, requireAuth } from '../lib/auth-helper.js';

const profileBodySchema = t.Object({
	name: t.Optional(t.String()),
	image: t.Optional(t.String()),
});

type ProfileBody = Static<typeof profileBodySchema>;

export const userRoutes = new Elysia({ prefix: '/api/users' })
	.patch(
		'/profile',
		async (ctx) => {
			const result = await requireAuth(ctx, async (authCtx) => {
				const { name, image } = ctx.body as ProfileBody;

				const updatedUser = await prisma.user.update({
					where: { id: authCtx.user.userId },
					data: {
						name,
						image,
					},
					select: {
						id: true,
						email: true,
						name: true,
						image: true,
						createdAt: true,
					},
				});

				return { response: { user: updatedUser } };
			});

			if (result.status) {
				ctx.set.status = result.status as 401;
			}
			return result.response;
		},
		{
			body: profileBodySchema,
		},
	)
	.get('/stats', async (ctx) => {
		const result = await requireAuth(ctx, async (authCtx) => {
			const [agentCount, conversationCount, sessionCount] = await Promise.all([
				prisma.agent.count({ where: { userId: authCtx.user.userId } }),
				prisma.conversation.count({ where: { userId: authCtx.user.userId } }),
				prisma.agentSession.count({ where: { userId: authCtx.user.userId } }),
			]);

			return {
				response: {
					stats: {
						agents: agentCount,
						conversations: conversationCount,
						sessions: sessionCount,
					},
				},
			};
		});

		if (result.status) {
			ctx.set.status = result.status as 401;
		}
		return result.response;
	});
