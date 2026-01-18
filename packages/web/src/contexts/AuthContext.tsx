import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService, type User } from '../services/auth';
import { api } from '../utils/api';

interface AuthContextType {
	user: User | null;
	loading: boolean;
	isInitialized: boolean;
	error: string | null;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string, name?: string) => Promise<void>;
	logout: () => Promise<void>;
	updateUser: (user: User) => void;
	clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(false);
	const [isInitialized, setIsInitialized] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const fetchUser = useCallback(async () => {
		try {
			await authService.refresh();
			const { user: userData } = await authService.getCurrentUser();
			setUser(userData);
		} catch {
			authService.clearAccessToken();
		} finally {
			setIsInitialized(true);
		}
	}, []);

	useEffect(() => {
		fetchUser();
	}, [fetchUser]);

	const login = async (email: string, password: string) => {
		setError(null);
		setLoading(true);
		try {
			const { user: userData } = await authService.login({ email, password });
			setUser(userData);
		} catch (err) {
			setError(err instanceof Error ? err.message : '登录失败');
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const register = async (email: string, password: string, name?: string) => {
		setError(null);
		setLoading(true);
		try {
			const { user: userData } = await authService.register({ email, password, name });
			setUser(userData);
		} catch (err) {
			setError(err instanceof Error ? err.message : '注册失败');
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const logout = async () => {
		await authService.logout();
		setUser(null);
	};

	const updateUser = (updatedUser: User) => {
		setUser(updatedUser);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				isInitialized,
				error,
				login,
				register,
				logout,
				updateUser,
				clearError,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
