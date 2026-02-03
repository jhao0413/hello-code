import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma.js';
import { hashApiKey } from '../lib/api-key.js';
import { createAuthError } from '../lib/auth-helper.js';

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
	)
	// Sync messages from CLI (using API Key authentication)
	.post(
		'/sync',
		async ({ body, set, request }) => {
			type SyncBody = {
				sessionId: string;
				messages: Array<{
					role: 'user' | 'assistant' | 'system';
					content: string;
					timestamp?: string;
				}>;
				title?: string;
			};
			const { sessionId, messages, title } = body as SyncBody;

			// Get API Key from Authorization header
			const authHeader = request.headers.get('authorization');
			if (!authHeader || !authHeader.startsWith('Bearer ')) {
				set.status = 401;
				return createAuthError('Missing or invalid API Key');
			}

			const apiKey = authHeader.substring(7); // Remove 'Bearer '
			const keyHash = hashApiKey(apiKey);

			// Verify API Key
			const dbKey = await prisma.apiKey.findUnique({
				where: { keyHash },
				include: { user: true },
			});

			if (!dbKey || dbKey.revokedAt || new Date() > dbKey.expiresAt) {
				set.status = 401;
				return createAuthError('Invalid or expired API Key');
			}

			const userId = dbKey.userId;

			// Update last used timestamp
			await prisma.apiKey.update({
				where: { id: dbKey.id },
				data: { lastUsedAt: new Date() },
			});

			// Find or create conversation by sessionId
			let conversation = await prisma.conversation.findFirst({
				where: {
					userId,
					id: sessionId, // Use sessionId as conversation ID
				},
			});

			if (!conversation) {
				conversation = await prisma.conversation.create({
					data: {
						id: sessionId,
						userId,
						title: title || 'CLI Session',
					},
				});
			}

			// Add messages
			const createdMessages = await Promise.all(
				messages.map((msg) =>
					prisma.message.create({
						data: {
							conversationId: conversation.id,
							role: msg.role.toUpperCase() as 'USER' | 'ASSISTANT' | 'SYSTEM',
							content: msg.content,
							createdAt: msg.timestamp ? new Date(msg.timestamp) : new Date(),
						},
					}),
				),
			);

			return {
				success: true,
				conversationId: conversation.id,
				messagesCount: createdMessages.length,
			};
		},
		{
			body: t.Object({
				sessionId: t.String(),
				messages: t.Array(
					t.Object({
						role: t.Union([t.Literal('user'), t.Literal('assistant'), t.Literal('system')]),
						content: t.String(),
						timestamp: t.Optional(t.String()),
					}),
				),
				title: t.Optional(t.String()),
			}),
		},
	);
