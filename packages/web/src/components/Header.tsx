import {
	BellOutlined,
	SearchOutlined,
	QuestionCircleOutlined,
	GithubOutlined,
} from '@ant-design/icons';
import { Button, Badge } from '@heroui/react';

interface HeaderProps {
	title: string;
	collapsed: boolean;
}

export function Header({ title, collapsed }: HeaderProps) {
	return (
		<header
			className={`sticky top-0 z-40 h-20 px-8 flex items-center justify-between
			bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300`}
		>
			{/* Left: Title & Breadcrumbs */}
			<div className="flex flex-col justify-center">
				<h1 className="text-2xl font-bold text-gray-800 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
					{title}
				</h1>
				<div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
					<span>Workspace</span>
					<span>/</span>
					<span className="text-primary">{title}</span>
				</div>
			</div>

			{/* Right: Actions */}
			<div className="flex items-center gap-4">
				{/* Search Bar */}
				<div className="hidden md:flex items-center bg-gray-100/50 hover:bg-gray-100 transition-colors rounded-full px-4 py-2 w-64 border border-transparent focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-sm">
					<SearchOutlined className="text-gray-400 text-lg" />
					<input
						type="text"
						placeholder="搜索..."
						className="bg-transparent border-none outline-none ml-2 w-full text-sm text-gray-600 placeholder:text-gray-400"
					/>
					<span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">⌘K</span>
				</div>

				<div className="h-8 w-px bg-gray-200 mx-2"></div>

				{/* Icons */}
				<div className="flex items-center gap-2">
					<Button
						isIconOnly
						variant="light"
						className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full"
					>
						<GithubOutlined className="text-lg" />
					</Button>
					
					<Button
						isIconOnly
						variant="light"
						className="text-gray-500 hover:text-primary hover:bg-primary/5 rounded-full"
					>
						<QuestionCircleOutlined className="text-lg" />
					</Button>

					<Button
						isIconOnly
						variant="light"
						className="text-gray-500 hover:text-primary hover:bg-primary/5 rounded-full relative"
					>
						<Badge content="" color="danger" shape="circle" size="sm" className="top-1 right-1">
							<BellOutlined className="text-lg" />
						</Badge>
					</Button>
				</div>
			</div>
		</header>
	);
}
