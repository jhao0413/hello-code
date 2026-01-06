import {
	HomeOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	MessageOutlined,
	PlusOutlined,
	SettingOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Tooltip } from '@heroui/react';
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const navItems = [
	{ path: '/', label: '仪表板', icon: <HomeOutlined className="text-lg" /> },
	{
		path: '/chat',
		label: '对话',
		icon: <MessageOutlined className="text-lg" />,
	},
];

export default function Layout() {
	const location = useLocation();
	const [collapsed, setCollapsed] = useState(false);

	return (
		<div className="flex bg-gray-50 h-screen">
			{/* Sidebar */}
			<aside
				className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col ${
					collapsed ? 'w-16' : 'w-60'
				}`}
			>
				{/* Logo */}
				<div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
					{!collapsed && (
						<Link to="/" className="flex items-center gap-2">
							<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
								<span className="text-white font-bold text-sm">HC</span>
							</div>
							<span className="font-semibold text-lg text-gray-800">
								Hello Code
							</span>
						</Link>
					)}
					{collapsed && (
						<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
							<span className="text-white font-bold text-sm">HC</span>
						</div>
					)}
				</div>

				{/* Navigation */}
				<nav className="flex-1 px-3 py-2">
					<ul className="space-y-1">
						{navItems.map((item) => {
							const isActive = location.pathname === item.path;
							return (
								<li key={item.path}>
									{collapsed ? (
										<Tooltip content={item.label} placement="right">
											<Link
												to={item.path}
												className={`flex items-center justify-center h-10 rounded-lg transition-colors ${
													isActive
														? 'bg-primary-100 text-primary'
														: 'text-gray-600 hover:bg-gray-100'
												}`}
											>
												{item.icon}
											</Link>
										</Tooltip>
									) : (
										<Link
											to={item.path}
											className={`flex items-center gap-3 h-10 px-3 rounded-lg transition-colors ${
												isActive
													? 'bg-primary-100 text-primary'
													: 'text-gray-600 hover:bg-gray-100'
											}`}
										>
											{item.icon}
											<span className="text-sm font-medium">{item.label}</span>
										</Link>
									)}
								</li>
							);
						})}
					</ul>
				</nav>

				{/* Bottom Section */}
				<div className="border-t border-gray-200 p-3">
					{collapsed ? (
						<Tooltip content="设置" placement="right">
							<Link
								to="/settings"
								className="flex items-center justify-center h-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
							>
								<SettingOutlined className="text-lg" />
							</Link>
						</Tooltip>
					) : (
						<Link
							to="/settings"
							className="flex items-center gap-3 h-10 px-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
						>
							<SettingOutlined className="text-lg" />
							<span className="text-sm font-medium">设置</span>
						</Link>
					)}

					{/* User Profile */}
					<div
						className={`mt-2 flex items-center ${
							collapsed ? 'justify-center' : 'gap-3 px-3'
						} py-2`}
					>
						<Avatar
							size="sm"
							name="User"
							className="bg-primary-100 text-primary"
						/>
						{!collapsed && (
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-gray-800 truncate">
									开发者
								</p>
								<p className="text-xs text-gray-500 truncate">管理员</p>
							</div>
						)}
					</div>

					{/* Collapse Toggle */}
					<button
						type="button"
						onClick={() => setCollapsed(!collapsed)}
						className={`mt-2 flex items-center ${
							collapsed ? 'justify-center' : 'gap-3 px-3'
						} h-10 w-full rounded-lg text-gray-600 hover:bg-gray-100 transition-colors`}
					>
						{collapsed ? (
							<MenuUnfoldOutlined className="text-lg" />
						) : (
							<>
								<MenuFoldOutlined className="text-lg" />
								<span className="text-sm font-medium">收起</span>
							</>
						)}
					</button>
				</div>
			</aside>

			{/* Main Content */}
			<main
				className={`flex-1 flex flex-col h-full transition-all duration-300 ${
					collapsed ? 'ml-16' : 'ml-60'
				}`}
			>
				{/* Top Header */}
				<header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40">
					<div>
						<h1 className="text-lg font-semibold text-gray-800">
							{navItems.find((item) => item.path === location.pathname)
								?.label || 'Hello Code'}
						</h1>
					</div>
					<div className="flex items-center gap-4">
						<span className="text-sm text-gray-500">
							{new Date().toLocaleDateString('zh-CN', {
								weekday: 'long',
								year: 'numeric',
								month: 'long',
								day: 'numeric',
							})}
						</span>
					</div>
				</header>

				{/* Page Content */}
				<div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
					{<Outlet />}
				</div>
			</main>
		</div>
	);
}
