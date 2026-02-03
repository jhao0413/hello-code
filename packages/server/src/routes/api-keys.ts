import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma.js';
import {
	generateApiKey,
	hashApiKey,
	verifyApiKey,
	getKeyPrefix,
	isValidApiKeyFormat,
} from '../lib/api-key.js';
import { createAuthError, requireAuth } from '../lib/auth-helper.js';

export const apiKeyRoutes = new Elysia({ prefix: '/api' })
	// Create new API key (requires authentication)
	.post(
		'/user/keys',
		async (ctx) => {
			const result = await requireAuth(ctx, async (authCtx) => {
				type CreateKeyBody = {
					name: string;
					expiresIn?: number; // days
				};
				const { name, expiresIn = 90 } = authCtx.body as CreateKeyBody;

				// Generate new API key
				const apiKey = generateApiKey();
				const keyHash = hashApiKey(apiKey);
				const keyPrefix = getKeyPrefix(apiKey);

				// Calculate expiration date
				const expiresAt = new Date();
				expiresAt.setDate(expiresAt.getDate() + expiresIn);

				// Save to database
				await prisma.apiKey.create({
					data: {
						keyHash,
						keyPrefix,
						name,
						userId: authCtx.user.userId,
						expiresAt,
					},
				});

				// Return the full key (only shown once!)
				return {
					response: {
						key: apiKey,
						expiresAt: expiresAt.toISOString(),
					},
				};
			});

			if (result.status) {
				ctx.set.status = result.status as 401;
			}
			return result.response;
		},
		{
			body: t.Object({
				name: t.String({ minLength: 1 }),
				expiresIn: t.Optional(t.Number({ minimum: 1, maximum: 365 })),
			}),
		},
	)
	// List all API keys for current user
	.get('/user/keys', async (ctx) => {
		const result = await requireAuth(ctx, async (authCtx) => {
			const keys = await prisma.apiKey.findMany({
				where: {
					userId: authCtx.user.userId,
					revokedAt: null,
				},
				select: {
					id: true,
					name: true,
					keyPrefix: true,
					createdAt: true,
					lastUsedAt: true,
					expiresAt: true,
				},
				orderBy: {
					createdAt: 'desc',
				},
			});

			return {
				response: {
					keys: keys.map((key) => ({
						...key,
						createdAt: key.createdAt.toISOString(),
						lastUsedAt: key.lastUsedAt?.toISOString(),
						expiresAt: key.expiresAt.toISOString(),
					})),
				},
			};
		});

		if (result.status) {
			ctx.set.status = result.status as 401;
		}
		return result.response;
	})
	// Delete an API key
	.delete(
		'/user/keys/:id',
		async (ctx) => {
			const result = await requireAuth(ctx, async (authCtx) => {
				const { id } = ctx.params;

				// Check if key exists and belongs to user
				const key = await prisma.apiKey.findUnique({
					where: { id },
					select: { userId: true },
				});

				if (!key) {
					return {
						response: createAuthError('API Key 不存在'),
						status: 404,
					};
				}

				if (key.userId !== authCtx.user.userId) {
					return {
						response: createAuthError('无权删除此 API Key'),
						status: 403,
					};
				}

				// Soft delete by setting revokedAt
				await prisma.apiKey.update({
					where: { id },
					data: { revokedAt: new Date() },
				});

				return {
					response: { success: true },
				};
			});

			if (result.status) {
				ctx.set.status = result.status as 404 | 403 | 401;
			}
			return result.response;
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	// Verify API key (used by CLI, no auth required)
	.post(
		'/auth/verify-key',
		async ({ body, set }) => {
			type VerifyKeyBody = {
				apiKey: string;
			};
			const { apiKey } = body as VerifyKeyBody;

			// Validate format
			if (!isValidApiKeyFormat(apiKey)) {
				set.status = 401;
				return {
					error: 'invalid_key',
					message: 'API Key 格式无效',
				};
			}

			// Hash the provided key
			const keyHash = hashApiKey(apiKey);

			// Find matching key in database
			const dbKey = await prisma.apiKey.findUnique({
				where: { keyHash },
				include: {
					user: {
						select: {
							id: true,
							email: true,
							name: true,
						},
					},
				},
			});

			// Check if key exists
			if (!dbKey) {
				set.status = 401;
				return {
					error: 'invalid_key',
					message: 'API Key 无效',
				};
			}

			// Check if key is revoked
			if (dbKey.revokedAt) {
				set.status = 401;
				return {
					error: 'revoked_key',
					message: 'API Key 已被撤销',
				};
			}

			// Check if key is expired
			if (new Date() > dbKey.expiresAt) {
				set.status = 401;
				return {
					error: 'expired_key',
					message: 'API Key 已过期',
				};
			}

			// Update last used timestamp
			await prisma.apiKey.update({
				where: { id: dbKey.id },
				data: { lastUsedAt: new Date() },
			});

			// Return user information
			return {
				user: dbKey.user,
				expiresAt: dbKey.expiresAt.toISOString(),
			};
		},
		{
			body: t.Object({
				apiKey: t.String(),
			}),
		},
	);
