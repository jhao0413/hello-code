import {
	HomeOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	MessageOutlined,
	SettingOutlined,
	LogoutOutlined,
	UserOutlined,
} from '@ant-design/icons';
import { Avatar, Tooltip } from '@heroui/react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
	collapsed: boolean;
	setCollapsed: (collapsed: boolean) => void;
}

const navItems = [
	{ path: '/', label: '仪表板', icon: <HomeOutlined className="text-xl" /> },
	{
		path: '/chat',
		label: 'AI 对话',
		icon: <MessageOutlined className="text-xl" />,
	},
	{
		path: '/agents',
		label: '智能体',
		icon: <UserOutlined className="text-xl" />,
	},
];

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
	const location = useLocation();

	return (
		<aside
			className={`fixed left-0 top-0 h-full bg-white/90 backdrop-blur-xl border-r border-gray-100 transition-all duration-500 ease-in-out z-50 flex flex-col shadow-2xl shadow-gray-200/50 ${
				collapsed ? 'w-20' : 'w-72'
			}`}
		>
			{/* Logo Section */}
			<div className="h-20 flex items-center px-6 border-b border-gray-100/50">
				<Link to="/" className="flex items-center gap-3 group overflow-hidden">
					<div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-110 shrink-0">
						<span className="text-white font-bold text-lg">HC</span>
					</div>
					<div
						className={`flex flex-col transition-opacity duration-300 ${
							collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
						}`}
					>
						<span className="font-bold text-xl text-gray-800 tracking-tight whitespace-nowrap">
							Hello Code
						</span>
						<span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
							Workspace
						</span>
					</div>
				</Link>
			</div>

			{/* Navigation */}
			<nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
				<div className="space-y-2">
					{navItems.map((item) => {
						const isActive = location.pathname === item.path;
						return (
							<div key={item.path}>
								{collapsed ? (
									<Tooltip
										content={item.label}
										placement="right"
										className="font-medium text-sm"
										closeDelay={0}
									>
										<Link
											to={item.path}
											className={`flex items-center justify-center w-12 h-12 mx-auto rounded-2xl transition-all duration-300 group relative ${
												isActive
													? 'bg-primary text-white shadow-lg shadow-primary/30'
													: 'text-gray-500 hover:bg-gray-50 hover:text-primary'
											}`}
										>
											{item.icon}
											{isActive && (
												<div className="absolute -right-4 w-1 h-6 bg-primary rounded-l-full" />
											)}
										</Link>
									</Tooltip>
								) : (
									<Link
										to={item.path}
										className={`flex items-center gap-4 px-4 h-12 rounded-xl transition-all duration-300 group relative overflow-hidden ${
											isActive
												? 'bg-primary text-white shadow-lg shadow-primary/30 translate-x-1'
												: 'text-gray-600 hover:bg-gray-50 hover:text-primary hover:pl-5'
										}`}
									>
										{/* Active Indicator Background */}
										{isActive && (
											<div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-20" />
										)}
										
										<span className="relative z-10">{item.icon}</span>
										<span className="relative z-10 font-medium tracking-wide">
											{item.label}
										</span>
										
										{/* Hover Arrow */}
										{!isActive && (
											<div className="absolute right-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
												<span className="text-xs text-primary/50">→</span>
											</div>
										)}
									</Link>
								)}
							</div>
						);
					})}
				</div>
			</nav>

			{/* Bottom Actions */}
			<div className="p-4 space-y-4">
				{/* Settings & Toggle */}
				<div className={`bg-gray-50/80 rounded-2xl p-2 ${collapsed ? 'flex flex-col gap-2' : 'space-y-2'}`}>
					{collapsed ? (
						<>
							<Tooltip content="设置" placement="right">
								<Link
									to="/settings"
									className="flex items-center justify-center w-full h-10 rounded-xl text-gray-500 hover:bg-white hover:shadow-sm transition-all"
								>
									<SettingOutlined className="text-lg" />
								</Link>
							</Tooltip>
							<button
								onClick={() => setCollapsed(!collapsed)}
								className="flex items-center justify-center w-full h-10 rounded-xl text-gray-500 hover:bg-white hover:shadow-sm transition-all"
							>
								<MenuUnfoldOutlined className="text-lg" />
							</button>
						</>
					) : (
						<>
							<Link
								to="/settings"
								className="flex items-center gap-3 px-3 h-10 rounded-xl text-gray-600 hover:bg-white hover:shadow-sm transition-all text-sm font-medium"
							>
								<SettingOutlined />
								<span>设置</span>
							</Link>
							<button
								onClick={() => setCollapsed(!collapsed)}
								className="flex items-center gap-3 px-3 w-full h-10 rounded-xl text-gray-600 hover:bg-white hover:shadow-sm transition-all text-sm font-medium"
							>
								<MenuFoldOutlined />
								<span>收起侧边栏</span>
							</button>
						</>
					)}
				</div>

				{/* User Profile */}
				<div className={`border-t border-gray-100 pt-4 ${collapsed ? 'flex justify-center' : ''}`}>
					<div className={`flex items-center gap-3 group cursor-pointer p-2 rounded-xl hover:bg-gray-50 transition-colors ${collapsed ? 'justify-center' : ''}`}>
						<div className="relative">
							<Avatar
								size="sm"
								name="User"
								className="bg-gradient-to-tr from-primary to-purple-500 text-white font-bold shadow-md shadow-primary/20 ring-2 ring-white"
							/>
							<div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
						</div>
						
						{!collapsed && (
							<div className="flex-1 min-w-0 overflow-hidden">
								<p className="text-sm font-bold text-gray-800 truncate group-hover:text-primary transition-colors">
									Admin User
								</p>
								<p className="text-xs text-gray-400 truncate flex items-center gap-1">
									<span>Pro Plan</span>
									<span className="w-1 h-1 bg-gray-300 rounded-full"></span>
									<span>在线</span>
								</p>
							</div>
						)}
						
						{!collapsed && (
							<LogoutOutlined className="text-gray-400 hover:text-red-500 transition-colors" />
						)}
					</div>
				</div>
			</div>
		</aside>
	);
}
