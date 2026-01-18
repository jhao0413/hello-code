import type { AccessPayload } from './auth.js';
import { verifyAccessToken, extractTokenFromHeader } from './auth.js';
import type { Context } from 'elysia';

export type AuthenticatedContext = Context & {
	user: AccessPayload;
};

export function createAuthError(message: string = 'Unauthorized') {
	return {
		error: 'UNAUTHORIZED',
		message,
	};
}

export function createAuthHandler() {
	return async (request: Request): Promise<AccessPayload | null> => {
		const authHeader = request.headers.get('authorization');
		const token = extractTokenFromHeader(authHeader);
		if (!token) {
			return null;
		}
		return verifyAccessToken(token);
	};
}

export function requireAuth<T extends Context>(
	ctx: T,
	handler: (ctx: AuthenticatedContext) => Promise<{ response: unknown; status?: number }>
): Promise<{ response: unknown; status?: number }> | { response: unknown; status?: number } {
	const authHeader = ctx.request.headers.get('authorization');
	const token = extractTokenFromHeader(authHeader);

	if (!token) {
		return { response: createAuthError('请先登录'), status: 401 };
	}

	return verifyAccessToken(token).then((user) => {
		if (!user) {
			return { response: createAuthError('Token 无效'), status: 401 };
		}
		const authCtx = ctx as unknown as AuthenticatedContext;
		authCtx.user = user;
		return handler(authCtx);
	});
}
