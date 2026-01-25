const API_BASE = '/api';

export interface User {
	id: string;
	email: string;
	name?: string;
	image?: string;
	createdAt: string;
	emailVerified?: boolean;
}

export interface AuthResponse {
	user: User;
	accessToken: string;
	message?: string;
}

export interface LoginParams {
	email: string;
	password: string;
}

export interface RegisterParams {
	email: string;
	password: string;
	name?: string;
}

let accessToken: string | null = null;

export const authService = {
	setAccessToken(token: string): void {
		accessToken = token;
	},

	getAccessToken(): string | null {
		return accessToken;
	},

	clearAccessToken(): void {
		accessToken = null;
	},

	async login(params: LoginParams): Promise<AuthResponse> {
		const response = await fetch(`${API_BASE}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(params),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));
			throw new Error(error.message || '登录失败');
		}

		const data: AuthResponse = await response.json();
		if (data.accessToken) {
			this.setAccessToken(data.accessToken);
		}
		return data;
	},

	async register(params: RegisterParams): Promise<AuthResponse> {
		const response = await fetch(`${API_BASE}/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(params),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));
			throw new Error(error.message || '注册失败');
		}

		const data: AuthResponse = await response.json();
		if (data.accessToken) {
			this.setAccessToken(data.accessToken);
		}
		return data;
	},

	async refresh(): Promise<{ accessToken: string }> {
		const response = await fetch(`${API_BASE}/auth/refresh`, {
			method: 'POST',
			credentials: 'include',
		});

		if (!response.ok) {
			this.clearAccessToken();
			throw new Error('Token 刷新失败');
		}

		const data: { accessToken: string } = await response.json();
		this.setAccessToken(data.accessToken);
		return data;
	},

	async logout(): Promise<void> {
		try {
			await fetch(`${API_BASE}/auth/logout`, {
				method: 'POST',
				credentials: 'include',
			});
		} finally {
			this.clearAccessToken();
		}
	},

	async getCurrentUser(): Promise<{ user: User }> {
		const response = await fetch(`${API_BASE}/auth/me`, {
			headers: {
				Authorization: `Bearer ${this.getAccessToken()}`,
			},
			credentials: 'include',
		});

		if (!response.ok) {
			throw new Error('获取用户信息失败');
		}

		return response.json();
	},

	async updateProfile(data: { name?: string; image?: string }): Promise<{ user: User }> {
		const response = await fetch(`${API_BASE}/users/profile`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.getAccessToken()}`,
			},
			credentials: 'include',
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error('更新资料失败');
		}

		return response.json();
	},

	async getUserStats(): Promise<{ stats: { agents: number; conversations: number; sessions: number } }> {
		const response = await fetch(`${API_BASE}/users/stats`, {
			headers: {
				Authorization: `Bearer ${this.getAccessToken()}`,
			},
			credentials: 'include',
		});

		if (!response.ok) {
			throw new Error('获取统计数据失败');
		}

		return response.json();
	},
};
