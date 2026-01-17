import {
	ArrowDownOutlined,
	ArrowUpOutlined,
	CalendarOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	CloseCircleOutlined,
	CloudDownloadOutlined,
	CrownOutlined,
	EllipsisOutlined,
	FieldTimeOutlined,
	FireOutlined,
	HistoryOutlined,
	MoreOutlined,
	ReloadOutlined,
	ThunderboltOutlined,
	TrophyOutlined,
	UserOutlined,
} from '@ant-design/icons';
import {
	Avatar,
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Progress,
	Skeleton,
	User,
} from '@heroui/react';
import { Col, Row, Timeline, DatePicker } from 'antd';
import { Fragment, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

const { RangePicker } = DatePicker;

interface DashboardStats {
	totalSessions: number;
	todaySessions: number;
	yesterdaySessions: number;
	thisWeekSessions: number;
	lastWeekSessions: number;
	monthSessions: number;
	totalTokens: number;
	promptTokens: number;
	completionTokens: number;
	successRate: number;
	modelUsage: { model: string; count: number; tokens: number }[];
	dailySessions: { date: string; count: number }[];
	recentSessions: {
		id: string;
		sessionId: string;
		userPrompt: string;
		success: boolean;
		model: string;
		totalTokens: number;
		duration: number;
		timestamp: string;
	}[];
	userRanking: {
		userId: string;
		name: string;
		email: string;
		sessionCount: number;
		totalTokens: number;
	}[];
	languageUsage: { language: string; count: number }[];
}

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const modelColors: Record<
	string,
	'primary' | 'secondary' | 'success' | 'warning' | 'danger'
> = {
	'claude-3-opus': 'primary',
	'claude-3-sonnet': 'secondary',
	'claude-3-haiku': 'success',
	'gpt-4': 'warning',
	'gpt-4o': 'danger',
};

const languageColors: Record<string, string> = {
	TypeScript: '#3178C6',
	JavaScript: '#F7DF1E',
	Python: '#3776AB',
	Java: '#ED8B00',
	Go: '#00ADD8',
	Rust: '#DEA584',
	'C++': '#00599C',
	C: '#A8B9CC',
	Ruby: '#CC342D',
	PHP: '#777BB4',
	Swift: '#F05138',
	Kotlin: '#7F52FF',
	Scala: '#DC322F',
	Shell: '#89E051',
	SQL: '#E38C00',
	HTML: '#E34F26',
	CSS: '#1572B6',
	Vue: '#4FC08D',
	React: '#61DAFB',
	Markdown: '#083FA1',
};

const defaultLanguageColors = [
	'#6366F1',
	'#EC4899',
	'#14B8A6',
	'#F59E0B',
	'#EF4444',
	'#8B5CF6',
	'#10B981',
	'#F97316',
	'#06B6D4',
	'#84CC16',
];

function getLanguageColor(language: string, index: number): string {
	return (
		languageColors[language] ||
		defaultLanguageColors[index % defaultLanguageColors.length]
	);
}

function getModelColor(model: string) {
	return modelColors[model] || 'primary';
}

function formatDuration(ms: number) {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}

function formatTimeAgo(timestamp: string) {
	const now = new Date();
	const time = new Date(timestamp);
	const diff = now.getTime() - time.getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);

	if (minutes < 1) return '刚刚';
	if (minutes < 60) return `${minutes} 分钟前`;
	if (hours < 24) return `${hours} 小时前`;
	return time.toLocaleDateString('zh-CN');
}

const createSmoothPath = (points: { x: number; y: number }[]) => {
	if (points.length < 2) return '';

	let d = `M ${points[0].x} ${points[0].y}`;

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i];
		const p1 = points[i + 1];
		const midX = (p0.x + p1.x) / 2;
		d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
	}

	return d;
};

// 骨架屏组件
const DashboardSkeleton = () => (
	<div className="space-y-6 animate-pulse">
		{/* Header Skeleton */}
		<div className="flex justify-between items-end mb-8">
			<div className="space-y-2">
				<Skeleton className="rounded-lg w-48 h-8" />
				<Skeleton className="rounded-lg w-64 h-4" />
			</div>
			<div className="flex gap-2">
				<Skeleton className="rounded-lg w-32 h-10" />
				<Skeleton className="rounded-lg w-10 h-10" />
			</div>
		</div>

		{/* Stats Grid Skeleton */}
		<Row gutter={[24, 24]}>
			{[1, 2, 3, 4].map((i) => (
				<Col xs={24} sm={12} xl={6} key={i}>
					<Card className="h-32 rounded-2xl">
						<CardBody className="flex flex-row items-center gap-4 p-6">
							<Skeleton className="rounded-xl w-14 h-14" />
							<div className="flex-1 space-y-2">
								<Skeleton className="rounded-lg w-20 h-4" />
								<Skeleton className="rounded-lg w-24 h-8" />
							</div>
						</CardBody>
					</Card>
				</Col>
			))}
		</Row>

		{/* Charts Skeleton */}
		<Row gutter={[24, 24]}>
			<Col xs={24} lg={16}>
				<Card className="h-[400px] rounded-2xl">
					<CardHeader className="px-6 pt-6">
						<Skeleton className="rounded-lg w-32 h-6" />
					</CardHeader>
					<CardBody>
						<Skeleton className="rounded-lg w-full h-full" />
					</CardBody>
				</Card>
			</Col>
			<Col xs={24} lg={8}>
				<Card className="h-[400px] rounded-2xl">
					<CardHeader className="px-6 pt-6">
						<Skeleton className="rounded-lg w-32 h-6" />
					</CardHeader>
					<CardBody className="space-y-4">
						{[1, 2, 3, 4, 5].map((i) => (
							<div key={i} className="space-y-2">
								<div className="flex justify-between">
									<Skeleton className="rounded w-16 h-4" />
									<Skeleton className="rounded w-10 h-4" />
								</div>
								<Skeleton className="rounded-full w-full h-2" />
							</div>
						))}
					</CardBody>
				</Card>
			</Col>
		</Row>
	</div>
);

export default function Dashboard() {
	const { user } = useAuth();
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		api.get('/agent-sessions/stats')
			.then((res) => setStats(res.data))
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, []);

	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 5) return '夜深了';
		if (hour < 12) return '早安';
		if (hour < 14) return '中午好';
		if (hour < 18) return '下午好';
		return '晚上好';
	};

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
				<div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
					<CloseCircleOutlined className="text-2xl text-red-500" />
				</div>
				<h3 className="text-lg font-semibold text-gray-800">加载失败</h3>
				<p className="text-gray-500">{error}</p>
				<Button
					color="primary"
					variant="flat"
					onPress={() => window.location.reload()}
					startContent={<ReloadOutlined />}
				>
					重试
				</Button>
			</div>
		);
	}

	if (loading || !stats) {
		return <DashboardSkeleton />;
	}

	const todayChange =
		stats.yesterdaySessions > 0
			? ((stats.todaySessions - stats.yesterdaySessions) /
					stats.yesterdaySessions) *
			  100
			: stats.todaySessions > 0
			  ? 100
			  : 0;

	const weekChange =
		stats.lastWeekSessions > 0
			? ((stats.thisWeekSessions - stats.lastWeekSessions) /
					stats.lastWeekSessions) *
			  100
			: stats.thisWeekSessions > 0
			  ? 100
			  : 0;

	const dailyData = (() => {
		const sessionMap = new Map(
			stats.dailySessions.map((d) => [
				new Date(d.date).toDateString(),
				d.count,
			]),
		);
		const result = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			result.push({
				day: dayNames[date.getDay()],
				count: sessionMap.get(date.toDateString()) || 0,
			});
		}
		return result;
	})();

	const maxCalls = Math.max(...dailyData.map((d) => d.count), 1);

	const totalModelCalls = stats.modelUsage.reduce((sum, m) => sum + m.count, 0);
	const modelUsageWithPercentage = stats.modelUsage.map((m) => ({
		...m,
		percentage: totalModelCalls > 0 ? (m.count / totalModelCalls) * 100 : 0,
	}));

	return (
		<Fragment>
			{/* Dashboard Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 fade-in">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">
						{getGreeting()}，{user?.name || '管理员'} <span className="text-2xl">👋</span>
					</h1>
					<p className="text-gray-500 mt-1 text-sm">
						这是您今天的平台概览数据报告
					</p>
				</div>
				<div className="flex items-center gap-3">
					<RangePicker className="h-10 border-none bg-white rounded-xl shadow-sm hover:bg-gray-50" />
					<Button
						isIconOnly
						className="bg-white shadow-sm text-gray-600 rounded-xl"
						variant="flat"
					>
						<CloudDownloadOutlined className="text-lg" />
					</Button>
					<Button
						color="primary"
						className="shadow-md shadow-primary/20 rounded-xl font-medium"
						startContent={<ReloadOutlined />}
						onPress={() => window.location.reload()}
					>
						刷新数据
					</Button>
				</div>
			</div>

			<div className="space-y-6">
				{/* Stats Cards */}
				<Row gutter={[24, 24]}>
					<Col xs={24} sm={12} xl={6}>
						<Card className="rounded-2xl border-none shadow-sm hover:shadow-lg transition-shadow duration-300">
							<CardBody className="p-6">
								<div className="flex items-start justify-between">
									<div className="space-y-2">
										<p className="text-sm font-medium text-gray-500">总会话数</p>
										<p className="text-3xl font-bold text-gray-800 tracking-tight">
											{stats.totalSessions.toLocaleString()}
										</p>
									</div>
									<div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm">
										<ThunderboltOutlined className="text-blue-500 text-xl" />
									</div>
								</div>
								<div className="mt-4 flex items-center text-xs font-medium">
									<div
										className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${
											weekChange >= 0
												? 'bg-green-50 text-green-600'
												: 'bg-red-50 text-red-600'
										}`}
									>
										{weekChange >= 0 ? (
											<ArrowUpOutlined />
										) : (
											<ArrowDownOutlined />
										)}
										<span>{Math.abs(weekChange).toFixed(0)}%</span>
									</div>
									<span className="text-gray-400 ml-2">较上周</span>
								</div>
							</CardBody>
						</Card>
					</Col>
					<Col xs={24} sm={12} xl={6}>
						<Card className="rounded-2xl border-none shadow-sm hover:shadow-lg transition-shadow duration-300">
							<CardBody className="p-6">
								<div className="flex items-start justify-between">
									<div className="space-y-2">
										<p className="text-sm font-medium text-gray-500">今日会话</p>
										<p className="text-3xl font-bold text-gray-800 tracking-tight">
											{stats.todaySessions}
										</p>
									</div>
									<div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shadow-sm">
										<ClockCircleOutlined className="text-green-500 text-xl" />
									</div>
								</div>
								<div className="mt-4 flex items-center text-xs font-medium">
									<div
										className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${
											todayChange >= 0
												? 'bg-green-50 text-green-600'
												: 'bg-red-50 text-red-600'
										}`}
									>
										{todayChange >= 0 ? (
											<ArrowUpOutlined />
										) : (
											<ArrowDownOutlined />
										)}
										<span>{Math.abs(todayChange).toFixed(0)}%</span>
									</div>
									<span className="text-gray-400 ml-2">较昨日</span>
								</div>
							</CardBody>
						</Card>
					</Col>
					<Col xs={24} sm={12} xl={6}>
						<Card className="rounded-2xl border-none shadow-sm hover:shadow-lg transition-shadow duration-300">
							<CardBody className="p-6">
								<div className="flex items-start justify-between">
									<div className="space-y-2">
										<p className="text-sm font-medium text-gray-500">
											Token 消耗
										</p>
										<p className="text-3xl font-bold text-gray-800 tracking-tight">
											{(stats.totalTokens / 1000).toFixed(1)}k
										</p>
									</div>
									<div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shadow-sm">
										<FireOutlined className="text-purple-500 text-xl" />
									</div>
								</div>
								<div className="mt-4 flex items-center justify-between text-xs text-gray-400">
									<div className="flex items-center gap-2">
										<span className="w-2 h-2 rounded-full bg-purple-200" />
										<span>输入: {(stats.promptTokens / 1000).toFixed(1)}k</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="w-2 h-2 rounded-full bg-purple-400" />
										<span>
											输出: {(stats.completionTokens / 1000).toFixed(1)}k
										</span>
									</div>
								</div>
							</CardBody>
						</Card>
					</Col>
					<Col xs={24} sm={12} xl={6}>
						<Card className="rounded-2xl border-none shadow-sm hover:shadow-lg transition-shadow duration-300">
							<CardBody className="p-6">
								<div className="flex items-start justify-between">
									<div className="space-y-2">
										<p className="text-sm font-medium text-gray-500">
											请求成功率
										</p>
										<p className="text-3xl font-bold text-gray-800 tracking-tight">
											{stats.successRate.toFixed(1)}%
										</p>
									</div>
									<div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shadow-sm">
										<CheckCircleOutlined className="text-orange-500 text-xl" />
									</div>
								</div>
								<div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
									<div
										className="bg-orange-400 h-1.5 rounded-full"
										style={{ width: `${stats.successRate}%` }}
									/>
								</div>
							</CardBody>
						</Card>
					</Col>
				</Row>

				<Row gutter={[24, 24]}>
					{/* Sessions Chart */}
					<Col xs={24} lg={16}>
						<Card className="border-none shadow-sm rounded-2xl h-full">
							<CardHeader className="px-6 pt-6 flex justify-between items-center">
								<div>
									<h2 className="text-lg font-bold text-gray-800">趋势分析</h2>
									<p className="text-xs text-gray-400">近 7 天会话活跃度</p>
								</div>
								<Button
									size="sm"
									variant="light"
									color="primary"
									endContent={<ArrowDownOutlined className="text-xs" />}
								>
									导出 CSV
								</Button>
							</CardHeader>
							<CardBody className="overflow-hidden px-2 pb-2">
								{dailyData.length > 0 ? (
									<div className="h-80 w-full relative">
										{(() => {
											const height = 300; // Increased internal height for better amplitude
											const width = 1200;
											const padding = 20;
											const contentWidth = width - padding * 2;
											const contentHeight = height - padding * 2;

											// Use a minimum maxCalls to prevent flat lines on low data
											const adjustedMaxCalls = Math.max(maxCalls, 5);

											const points = dailyData.map((d, i) => ({
												x:
													padding +
													(i / (dailyData.length - 1)) * contentWidth,
												y:
													padding +
													contentHeight -
													(d.count / adjustedMaxCalls) * contentHeight,
												value: d.count,
												label: d.day,
											}));

											const pathD = createSmoothPath(points);
											const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

											return (
												<svg
													viewBox={`0 0 ${width} ${height + 40}`}
													className="w-full h-full overflow-visible"
													preserveAspectRatio="none"
												>
													<defs>
														<linearGradient
															id="chartGradient"
															x1="0"
															y1="0"
															x2="0"
															y2="1"
														>
															<stop
																offset="0%"
																stopColor="#3B82F6"
																stopOpacity="0.2"
															/>
															<stop
																offset="100%"
																stopColor="#3B82F6"
																stopOpacity="0"
															/>
														</linearGradient>
														<filter id="shadow" colorInterpolationFilters="sRGB">
															<feDropShadow
																dx="0"
																dy="4"
																stdDeviation="4"
																floodColor="#3B82F6"
																floodOpacity="0.3"
															/>
														</filter>
													</defs>

													{/* Grid lines */}
													{[0, 0.25, 0.5, 0.75, 1].map((t) => (
														<line
															key={t}
															x1={padding}
															y1={padding + contentHeight * t}
															x2={width - padding}
															y2={padding + contentHeight * t}
															stroke="#F3F4F6"
															strokeDasharray="4 4"
															strokeWidth="1"
														/>
													))}

													{/* Area */}
													<path d={areaD} fill="url(#chartGradient)" />

													{/* Line */}
													<path
														d={pathD}
														fill="none"
														stroke="#3B82F6"
														strokeWidth="4"
														strokeLinecap="round"
														strokeLinejoin="round"
														filter="url(#shadow)"
													/>

													{/* Points and Tooltips */}
													{points.map((p, _i) => (
														<g key={`${p.x}-${p.y}`} className="group">
															<rect
																x={p.x - 40}
																y={0}
																width={80}
																height={height}
																fill="transparent"
																className="cursor-pointer"
															/>
															
															{/* Vertical Guide Line on Hover */}
															<line
																x1={p.x}
																y1={padding}
																x2={p.x}
																y2={height}
																stroke="#3B82F6"
																strokeWidth="1"
																strokeDasharray="4 4"
																className="opacity-0 group-hover:opacity-40 transition-opacity"
															/>

															<circle
																cx={p.x}
																cy={p.y}
																r="5"
																className="fill-white stroke-blue-500 stroke-[3px] transition-all duration-300 group-hover:r-7"
															/>

															{/* Fancy Tooltip */}
															<foreignObject
																x={p.x - 50}
																y={p.y - 60}
																width="100"
																height="50"
																className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
															>
																<div className="flex flex-col items-center justify-center">
																	<div className="bg-gray-900/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-lg shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
																		<span className="font-bold">{p.value}</span> 次会话
																	</div>
																	<div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900/90"></div>
																</div>
															</foreignObject>

															<text
																x={p.x}
																y={height + 30}
																textAnchor="middle"
																className="text-xs fill-gray-400 font-medium"
															>
																{p.label}
															</text>
														</g>
													))}
												</svg>
											);
										})()}
									</div>
								) : (
									<div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl m-4 border border-dashed border-gray-200">
										<FieldTimeOutlined className="text-3xl mb-2 text-gray-300" />
										<span>暂无活动数据</span>
									</div>
								)}
							</CardBody>
						</Card>
					</Col>

					{/* Model Usage */}
					<Col xs={24} lg={8}>
						<Card className="h-full border-none shadow-sm rounded-2xl">
							<CardHeader className="px-6 pt-6 pb-0">
								<h2 className="text-lg font-bold text-gray-800">模型分布</h2>
							</CardHeader>
							<CardBody className="p-6">
								{modelUsageWithPercentage.length > 0 ? (
									<div className="space-y-5">
										{modelUsageWithPercentage.map((model) => (
											<div key={model.model} className="group">
												<div className="flex justify-between text-sm mb-2">
													<span className="font-medium text-gray-700 group-hover:text-primary transition-colors">
														{model.model}
													</span>
													<div className="flex items-center gap-2">
														<span className="text-gray-500 text-xs">
															{(model.tokens / 1000).toFixed(0)}k tkns
														</span>
														<span className="font-bold text-gray-800">
															{model.percentage.toFixed(0)}%
														</span>
													</div>
												</div>
												<Progress
													value={model.percentage}
													color={getModelColor(model.model)}
													size="sm"
													className="h-2.5"
													classNames={{
														track: 'bg-gray-100',
														indicator: 'transition-all duration-500 ease-out',
													}}
												/>
											</div>
										))}
									</div>
								) : (
									<div className="h-32 flex items-center justify-center text-gray-400">
										暂无数据
									</div>
								)}
							</CardBody>
						</Card>
					</Col>
				</Row>

				{/* Bottom Row */}
				<Row gutter={[24, 24]}>
					{/* Language Stats */}
					<Col xs={24} lg={8}>
						<Card className="h-full border-none shadow-sm rounded-2xl">
							<CardHeader className="px-6 pt-6 flex justify-between items-center">
								<h2 className="text-lg font-bold text-gray-800">热门语言</h2>
								<Button size="sm" isIconOnly variant="light" className="text-gray-400">
									<MoreOutlined />
								</Button>
							</CardHeader>
							<CardBody className="p-6">
								{stats.languageUsage.length > 0 ? (
									<div className="flex flex-col h-full gap-6">
										<div className="relative w-48 h-48 mx-auto flex-shrink-0 group">
											<div className="absolute inset-0 rounded-full border-8 border-gray-50"></div>
											<svg
												viewBox="0 0 100 100"
												className="w-full h-full transform -rotate-90 drop-shadow-lg"
											>
												{(() => {
													const total = stats.languageUsage.reduce(
														(sum, l) => sum + l.count,
														0,
													);
													let currentOffset = 0;
													const radius = 40;
													const circumference = 2 * Math.PI * radius;

													return stats.languageUsage.map((lang, index) => {
														const percentage = (lang.count / total) * 100;
														const dashArray = `${(percentage / 100) * circumference} ${circumference}`;
														const dashOffset = -(
															(currentOffset / 100) *
															circumference
														);
														currentOffset += percentage;

														return (
															<circle
																key={lang.language}
																cx="50"
																cy="50"
																r={radius}
																fill="transparent"
																stroke={getLanguageColor(lang.language, index)}
																strokeWidth="12"
																strokeDasharray={dashArray}
																strokeDashoffset={dashOffset}
																className="transition-all duration-300 hover:stroke-width-14 cursor-pointer hover:opacity-90"
															/>
														);
													});
												})()}
											</svg>
											<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
												<span className="text-3xl font-black text-gray-800">
													{stats.languageUsage.length}
												</span>
												<span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
													LANGS
												</span>
											</div>
										</div>

										<div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-60 pr-2">
											{stats.languageUsage.slice(0, 6).map((lang, index) => {
												const total = stats.languageUsage.reduce(
													(sum, l) => sum + l.count,
													0,
												);
												const percentage = (lang.count / total) * 100;
												return (
													<div
														key={lang.language}
														className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
													>
														<div className="flex items-center gap-3">
															<div
																className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
																style={{
																	backgroundColor: getLanguageColor(
																		lang.language,
																		index,
																	),
																}}
															/>
															<span className="text-sm font-medium text-gray-700">
																{lang.language}
															</span>
														</div>
														<span className="text-sm text-gray-500 font-mono">
															{percentage.toFixed(1)}%
														</span>
													</div>
												);
											})}
										</div>
									</div>
								) : (
									<div className="h-40 flex items-center justify-center text-gray-400">
										暂无数据
									</div>
								)}
							</CardBody>
						</Card>
					</Col>

					{/* User Ranking */}
					<Col xs={24} lg={8}>
						<Card className="h-full border-none shadow-sm rounded-2xl">
							<CardHeader className="px-6 pt-6 flex justify-between items-center pb-2">
								<h2 className="text-lg font-bold text-gray-800">活跃用户</h2>
								<Chip
									size="sm"
									variant="flat"
									color="warning"
									startContent={<TrophyOutlined />}
									className="px-2"
								>
									Top 10
								</Chip>
							</CardHeader>
							<CardBody className="overflow-y-auto max-h-[500px] custom-scrollbar p-0">
								{stats.userRanking.length > 0 ? (
									<div className="divide-y divide-gray-100">
										{stats.userRanking.map((user, index) => (
											<div
												key={user.userId}
												className="flex items-center justify-between p-4 hover:bg-amber-50/30 transition-colors"
											>
												<div className="flex items-center gap-3">
													<div className="relative">
														<Avatar
															size="md"
															name={user.name}
															src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
															className="ring-2 ring-white shadow-sm bg-gray-100"
														/>
														{index < 3 && (
															<div
																className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white text-[10px] shadow-sm ${
																	index === 0
																		? 'bg-yellow-400 text-white'
																		: index === 1
																		  ? 'bg-gray-400 text-white'
																		  : 'bg-orange-400 text-white'
																}`}
															>
																{index + 1}
															</div>
														)}
													</div>
													<div>
														<p className="font-semibold text-gray-800 text-sm">
															{user.name}
														</p>
														<p className="text-xs text-gray-400">
															{user.email}
														</p>
													</div>
												</div>
												<div className="text-right">
													<p className="font-bold text-gray-800">
														{user.sessionCount}
													</p>
													<p className="text-[10px] text-gray-400">会话</p>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="h-32 flex items-center justify-center text-gray-400">
										暂无数据
									</div>
								)}
							</CardBody>
						</Card>
					</Col>

					{/* Activity Log */}
					<Col xs={24} lg={8}>
						<Card className="h-full border-none shadow-sm rounded-2xl">
							<CardHeader className="px-6 pt-6 flex justify-between items-center">
								<h2 className="text-lg font-bold text-gray-800">最近活动</h2>
								<Button size="sm" isIconOnly variant="light" className="text-gray-400">
									<HistoryOutlined />
								</Button>
							</CardHeader>
							<CardBody className="overflow-y-auto max-h-[500px] custom-scrollbar p-6">
								{stats.recentSessions.length > 0 ? (
									<Timeline
										className="mt-2"
										items={stats.recentSessions.map((session) => ({
											color: session.success ? '#10B981' : '#EF4444',
											dot: session.success ? (
												<div className="w-3 h-3 bg-green-500 rounded-full ring-4 ring-green-100" />
											) : (
												<div className="w-3 h-3 bg-red-500 rounded-full ring-4 ring-red-100" />
											),
											children: (
												<div className="pb-6 pl-2 group">
													<div className="flex justify-between items-start mb-1">
														<span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
															{formatTimeAgo(session.timestamp)}
														</span>
														<span className="text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
															#{session.sessionId.slice(-4)}
														</span>
													</div>
													<div className="bg-gray-50 rounded-xl p-3 border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
														<p className="text-gray-700 text-sm font-medium line-clamp-2 leading-relaxed mb-2">
															{session.userPrompt}
														</p>
														<div className="flex items-center gap-2 mt-1">
															<Chip size="sm" variant="flat" className="h-5 text-[10px] bg-white border border-gray-200">
																{session.model}
															</Chip>
															<span className="text-[10px] text-gray-400 flex items-center gap-1">
																<FieldTimeOutlined />
																{formatDuration(session.duration)}
															</span>
														</div>
													</div>
												</div>
											),
										}))}
									/>
								) : (
									<div className="h-32 flex items-center justify-center text-gray-400">
										暂无会话记录
									</div>
								)}
							</CardBody>
						</Card>
					</Col>
				</Row>
			</div>
		</Fragment>
	);
}
