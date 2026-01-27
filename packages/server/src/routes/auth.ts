import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma.js';
import {
	createAccessToken,
	createRefreshToken,
	hashPassword,
	verifyPassword,
	verifyRefreshToken,
	type AccessPayload,
	type RefreshPayload,
} from '../lib/auth.js';
import { createAuthError, requireAuth } from '../lib/auth-helper.js';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const authRoutes = new Elysia({ prefix: '/api/auth' })
	.post(
		'/register',
		async ({ body, set, cookie }) => {
			type RegisterBody = {
				email: string;
				password: string;
				name?: string;
			};
			const { email, password, name } = body as RegisterBody;

			const existingUser = await prisma.user.findUnique({
				where: { email },
			});

			if (existingUser) {
				set.status = 400;
				return { message: '邮箱已被注册' };
			}

			const passwordHash = await hashPassword(password);

			const user = await prisma.user.create({
				data: {
					email,
					name,
					passwordHash,
				},
				select: {
					id: true,
					email: true,
					name: true,
					image: true,
					createdAt: true,
				},
			});

			const accessPayload: AccessPayload = {
				userId: user.id,
				email: user.email,
				type: 'access',
			};

			const refreshPayload: RefreshPayload = {
				userId: user.id,
				email: user.email,
				type: 'refresh',
			};

			const accessToken = await createAccessToken(accessPayload);
			const refreshToken = await createRefreshToken(refreshPayload);

			cookie.refresh_token.set({
				value: refreshToken,
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: COOKIE_MAX_AGE,
				path: '/',
			});

			return {
				user,
				accessToken,
			};
		},
		{
			body: t.Object({
				email: t.String({ format: 'email' }),
				password: t.String({ minLength: 6 }),
				name: t.Optional(t.String()),
			}),
		},
	)
	.post(
		'/login',
		async ({ body, set, cookie }) => {
			type LoginBody = {
				email: string;
				password: string;
			};
			const { email, password } = body as LoginBody;

			const user = await prisma.user.findUnique({
				where: { email },
			});

			if (!user || !user.passwordHash) {
				set.status = 401;
				return { message: '邮箱或密码错误' };
			}

			const isValid = await verifyPassword(password, user.passwordHash);

			if (!isValid) {
				set.status = 401;
				return { message: '邮箱或密码错误' };
			}

			const accessPayload: AccessPayload = {
				userId: user.id,
				email: user.email,
				type: 'access',
			};

			const refreshPayload: RefreshPayload = {
				userId: user.id,
				email: user.email,
				type: 'refresh',
			};

			const accessToken = await createAccessToken(accessPayload);
			const refreshToken = await createRefreshToken(refreshPayload);

			cookie.refresh_token.set({
				value: refreshToken,
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: COOKIE_MAX_AGE,
				path: '/',
			});

			return {
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					image: user.image,
					createdAt: user.createdAt,
				},
				accessToken,
			};
		},
		{
			body: t.Object({
				email: t.String({ format: 'email' }),
				password: t.String(),
			}),
		},
	)
	.post(
		'/refresh',
		async ({ cookie, set }) => {
			const refreshToken =
				typeof cookie.refresh_token.value === 'string'
					? cookie.refresh_token.value
					: undefined;

			if (!refreshToken) {
				set.status = 401;
				return createAuthError('请先登录');
			}

			const payload = await verifyRefreshToken(refreshToken);

			if (!payload) {
				set.status = 401;
				cookie.refresh_token.remove();
				return createAuthError('登录已过期，请重新登录');
			}

			const accessPayload: AccessPayload = {
				userId: payload.userId,
				email: payload.email,
				type: 'access',
			};

			const newAccessToken = await createAccessToken(accessPayload);

			return { accessToken: newAccessToken };
		},
	)
	.post(
		'/logout',
		async ({ cookie }) => {
			cookie.refresh_token.remove();
			return { success: true };
		},
	)
	.get(
		'/me',
		async (ctx) => {
			const result = await requireAuth(ctx, async (authCtx) => {
				const dbUser = await prisma.user.findUnique({
					where: { id: authCtx.user.userId },
					select: {
						id: true,
						email: true,
						name: true,
						image: true,
						createdAt: true,
						emailVerified: true,
					},
				});

				if (!dbUser) {
					return {
						response: createAuthError('用户不存在'),
						status: 401,
					};
				}

				return { response: { user: dbUser } };
			});

			if (result.status) {
				ctx.set.status = result.status as 401;
			}
			return result.response;
		},
	);
