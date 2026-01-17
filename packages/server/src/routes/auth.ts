import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma.js';
import {
	createAccessToken,
	createRefreshToken,
	hashPassword,
	verifyPassword,
	verifyRefreshToken,
	type AccessPayload,
} from '../lib/auth.js';
import { createAuthError } from '../middleware/auth.js';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const authRoutes = new Elysia({ prefix: '/api/auth' })
	.post(
		'/register',
		async ({ body, set, cookie }) => {
			const { email, password, name } = body;

			const existingUser = await prisma.user.findUnique({
				where: { email },
			});

			if (existingUser) {
				set.status = 400;
				return { message: '邮箱已被注册' };
			}

			const password_hash = await hashPassword(password);

			const user = await prisma.user.create({
				data: {
					email,
					name,
					password_hash,
				},
				select: {
					id: true,
					email: true,
					name: true,
					image: true,
					created_at: true,
				},
			});

			const accessPayload: AccessPayload = {
				userId: user.id,
				email: user.email,
				type: 'access',
			};

			const refreshPayload = {
				userId: user.id,
				email: user.email,
				type: 'refresh',
			};

			const access_token = await createAccessToken(accessPayload);
			const refresh_token = await createRefreshToken(refreshPayload);

			cookie.refresh_token.set({
				value: refresh_token,
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: COOKIE_MAX_AGE,
				path: '/api/auth/refresh',
			});

			return {
				user,
				access_token,
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
			const { email, password } = body;

			const user = await prisma.user.findUnique({
				where: { email },
			});

			if (!user || !user.password_hash) {
				set.status = 401;
				return { message: '邮箱或密码错误' };
			}

			const isValid = await verifyPassword(password, user.password_hash);

			if (!isValid) {
				set.status = 401;
				return { message: '邮箱或密码错误' };
			}

			const accessPayload: AccessPayload = {
				userId: user.id,
				email: user.email,
				type: 'access',
			};

			const refreshPayload = {
				userId: user.id,
				email: user.email,
				type: 'refresh',
			};

			const access_token = await createAccessToken(accessPayload);
			const refresh_token = await createRefreshToken(refreshPayload);

			cookie.refresh_token.set({
				value: refresh_token,
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: COOKIE_MAX_AGE,
				path: '/api/auth/refresh',
			});

			return {
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					image: user.image,
					created_at: user.created_at,
				},
				access_token,
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
			const refresh_token = cookie.refresh_token.value;

			if (!refresh_token) {
				set.status = 401;
				return createAuthError('请先登录');
			}

			const payload = await verifyRefreshToken(refresh_token);

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

			const new_access_token = await createAccessToken(accessPayload);

			return { access_token: new_access_token };
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
		async ({ user, set }) => {
			if (!user) {
				set.status = 401;
				return createAuthError('请先登录');
			}

			const dbUser = await prisma.user.findUnique({
				where: { id: user.userId },
				select: {
					id: true,
					email: true,
					name: true,
					image: true,
					created_at: true,
					email_verified: true,
				},
			});

			if (!dbUser) {
				set.status = 401;
				return createAuthError('用户不存在');
			}

			return { user: dbUser };
		},
	);
