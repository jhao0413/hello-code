import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma.js';

export const conversationRoutes = new Elysia({ prefix: '/api/conversations' })
	// Get all conversations
	.get(
		'/',
		async ({ query }) => {
			const { userId } = query;
			const conversations = await prisma.conversation.findMany({
				where: userId ? { userId } : undefined,
				include: {
					messages: {
						orderBy: { createdAt: 'asc' },
						take: 1,
					},
					agent: {
						select: { name: true },
					},
				},
				orderBy: { updatedAt: 'desc' },
			});
			return conversations;
		},
		{
			query: t.Object({
				userId: t.Optional(t.String()),
			}),
		},
	)
	// Get single conversation with messages
	.get(
		'/:id',
		async ({ params, set }) => {
			const conversation = await prisma.conversation.findUnique({
				where: { id: params.id },
				include: {
					messages: {
						orderBy: { createdAt: 'asc' },
					},
					agent: true,
				},
			});
			if (!conversation) {
				set.status = 404;
				return { message: 'Conversation not found' };
			}
			return conversation;
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	// Create conversation
	.post(
		'/',
		async ({ body }) => {
			const conversation = await prisma.conversation.create({
				data: body as {
					title?: string;
					userId: string;
					agentId?: string;
				},
			});
			return conversation;
		},
		{
			body: t.Object({
				title: t.Optional(t.String()),
				userId: t.String(),
				agentId: t.Optional(t.String()),
			}),
		},
	)
	// Delete conversation
	.delete(
		'/:id',
		async ({ params }) => {
			await prisma.conversation.delete({
				where: { id: params.id },
			});
			return { success: true };
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	);
