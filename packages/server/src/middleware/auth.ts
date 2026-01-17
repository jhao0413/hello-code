import { Elysia, t, type Context } from 'elysia';
import { verifyAccessToken, extractTokenFromHeader, type AccessPayload } from '../lib/auth.js';

export const authMiddleware = new Elysia({ name: 'auth' }).resolve(async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	const token = extractTokenFromHeader(authHeader);

	if (!token) {
		return { user: null as AccessPayload | null };
	}

	const user = await verifyAccessToken(token);
	return { user };
});

export type AuthContext = { user: AccessPayload | null };

/**
 * 从 Elysia context 中获取经过认证的 user
 * 返回 user 和一个用于返回认证错误的函数
 */
export function withAuth<T extends Context & { user?: AccessPayload | null }>(
	ctx: T
): { user: AccessPayload | null; set: T['set'] } {
	return { user: (ctx as unknown as AuthContext).user, set: ctx.set };
}

export function requireAuth(error?: string) {
	return t.Object({
		error: t.Optional(t.String()),
		message: t.Optional(t.String()),
	});
}

export function createAuthError(message: string = 'Unauthorized') {
	return {
		error: 'UNAUTHORIZED',
		message,
	};
}
