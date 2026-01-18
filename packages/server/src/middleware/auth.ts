import { t, type Context } from 'elysia';
import { verifyAccessToken, extractTokenFromHeader, type AccessPayload } from '../lib/auth.js';

export type AuthContext = { user: AccessPayload | null };

export function withAuth<T extends Context & { user?: AccessPayload | null }>(
	ctx: T
): { user: AccessPayload | null; set: T['set'] } {
	return { user: ctx.user ?? null, set: ctx.set };
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
