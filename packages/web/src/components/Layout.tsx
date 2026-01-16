import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export default function Layout() {
	const location = useLocation();
	const [collapsed, setCollapsed] = useState(false);

	const getTitle = () => {
		switch (location.pathname) {
			case '/':
				return '仪表板';
			case '/chat':
				return 'AI 对话';
			case '/agents':
				return '智能体';
			case '/settings':
				return '设置';
			default:
				return 'Hello Code';
		}
	};

	return (
		<div className="flex min-h-screen bg-[#f8fafc] overflow-hidden">
			{/* Background Decoration */}
			<div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
				<div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
				<div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-[100px]" />
			</div>

			<Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

			<main
				className={`flex-1 flex flex-col h-screen transition-all duration-500 ease-in-out relative z-10 ${
					collapsed ? 'ml-20' : 'ml-72'
				}`}
			>
				<Header title={getTitle()} collapsed={collapsed} />

				<div className={`flex-1 relative ${location.pathname === '/chat' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar p-6'}`}>
					<div className={`h-full ${location.pathname === '/chat' ? '' : 'w-full animate-fade-in'}`}>
						<Outlet />
					</div>
				</div>
			</main>
		</div>
	);
}