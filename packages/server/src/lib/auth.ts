import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET_ENV = process.env.JWT_SECRET;

if (!JWT_SECRET_ENV) {
	throw new Error('FATAL: JWT_SECRET environment variable is required. Authentication cannot function without a secure secret key.');
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_ENV);

const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '30m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface AccessPayload extends JWTPayload {
	userId: string;
	email: string;
	type: 'access';
}

export interface RefreshPayload extends JWTPayload {
	userId: string;
	email: string;
	type: 'refresh';
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12);
}

export async function verifyPassword(
	password: string,
	hashedPassword: string
): Promise<boolean> {
	return bcrypt.compare(password, hashedPassword);
}

export async function createAccessToken(payload: AccessPayload): Promise<string> {
	return new SignJWT({ ...payload })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(JWT_ACCESS_EXPIRES_IN)
		.sign(JWT_SECRET);
}

export async function createRefreshToken(payload: RefreshPayload): Promise<string> {
	return new SignJWT({ ...payload })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(JWT_REFRESH_EXPIRES_IN)
		.sign(JWT_SECRET);
}

export async function verifyAccessToken(token: string): Promise<AccessPayload | null> {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		if ((payload as AccessPayload).type !== 'access') {
			return null;
		}
		return payload as AccessPayload;
	} catch {
		return null;
	}
}

export async function verifyRefreshToken(token: string): Promise<RefreshPayload | null> {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		if ((payload as RefreshPayload).type !== 'refresh') {
			return null;
		}
		return payload as RefreshPayload;
	} catch {
		return null;
	}
}

export function extractTokenFromHeader(
	authHeader: string | null | undefined
): string | null {
	if (!authHeader?.startsWith('Bearer ')) {
		return null;
	}
	return authHeader.slice(7);
}
