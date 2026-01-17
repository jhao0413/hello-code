import { Elysia, t } from 'elysia';
import { verifyAccessToken, extractTokenFromHeader, type AccessPayload } from '../lib/auth.js';

declare module 'elysia' {
	interface Context {
		user?: AccessPayload;
	}
}

export const authMiddleware = new Elysia({ name: 'auth' }).derive(
	async ({ request }) => {
		const authHeader = request.headers.get('authorization');
		const token = extractTokenFromHeader(authHeader);

		if (!token) {
			return { user: undefined };
		}

		const user = await verifyAccessToken(token);
		return { user };
	}
);

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
