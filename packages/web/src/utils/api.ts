import axios from 'axios';
import { authService } from '../services/auth';

const API_BASE = '/api';

export const api = axios.create({
	baseURL: API_BASE,
	headers: {
		'Content-Type': 'application/json',
	},
});

let isRefreshing = false;
let failedRequestsQueue: Array<{
	resolve: (token: string) => void;
	reject: (error: Error) => void;
}> = [];

api.interceptors.request.use(
	(config) => {
		const accessToken = authService.getAccessToken();
		if (accessToken) {
			config.headers.Authorization = `Bearer ${accessToken}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			if (!isRefreshing) {
				isRefreshing = true;

				try {
					const { access_token } = await authService.refresh();
					authService.setAccessToken(access_token);

					failedRequestsQueue.forEach(({ resolve }) => resolve(accessToken));
					failedRequestsQueue = [];

					originalRequest.headers.Authorization = `Bearer ${access_token}`;
					return api(originalRequest);
				} catch (refreshError) {
					failedRequestsQueue.forEach(({ reject }) => reject(refreshError as Error));
					failedRequestsQueue = [];

					authService.logout();
					window.location.href = '/login';
					return Promise.reject(refreshError);
				} finally {
					isRefreshing = false;
				}
			}

			return new Promise<string>((resolve, reject) => {
				failedRequestsQueue.push({
					resolve: (token: string) => {
						originalRequest.headers.Authorization = `Bearer ${token}`;
						resolve(api(originalRequest));
					},
					reject: (error: Error) => {
						reject(error);
					},
				});
			});
		}

		return Promise.reject(error);
	}
);
