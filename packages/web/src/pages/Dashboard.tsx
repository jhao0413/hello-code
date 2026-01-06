import {
	ArrowDownOutlined,
	ArrowUpOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	CloseCircleOutlined,
	CrownOutlined,
	FieldTimeOutlined,
	FireOutlined,
	HistoryOutlined,
	ThunderboltOutlined,
	TrophyOutlined,
} from '@ant-design/icons';
import {
	Avatar,
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Progress,
	Spinner,
} from '@heroui/react';
import { Col, Row, Timeline } from 'antd';
import { Fragment, useEffect, useState } from 'react';

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

	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes} min ago`;
	if (hours < 24) return `${hours} hours ago`;
	return time.toLocaleDateString('en-US');
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

export default function Dashboard() {
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetch('/api/agent-sessions/stats')
			.then((res) => {
				if (!res.ok) throw new Error('Failed to fetch stats');
				return res.json();
			})
			.then(setStats)
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Spinner size="lg" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-64 text-red-500">
				加载失败: {error}
			</div>
		);
	}

	if (!stats) return null;

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
			<div className="space-y-6">
				{/* Stats Cards */}
<Row gutter={[16, 16]}>
				<Col xs={24} sm={12} lg={6}>
					<Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
							<CardBody className="py-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-gray-500 mb-1">总会话数</p>
										<p className="text-2xl font-bold text-gray-800">
											{stats.totalSessions.toLocaleString()}
										</p>
										<div className="flex items-center mt-1 text-xs">
											{weekChange >= 0 ? (
												<span className="text-green-600 flex items-center">
													<ArrowUpOutlined className="mr-1" />
													较上周 +{weekChange.toFixed(0)}%
												</span>
											) : (
												<span className="text-red-600 flex items-center">
													<ArrowDownOutlined className="mr-1" />
													较上周 {weekChange.toFixed(0)}%
												</span>
											)}
										</div>
									</div>
									<div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
										<ThunderboltOutlined className="text-blue-600 text-xl" />
									</div>
								</div>
							</CardBody>
						</Card>
</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
							<CardBody className="py-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-gray-500 mb-1">今日会话</p>
										<p className="text-2xl font-bold text-gray-800">
											{stats.todaySessions}
										</p>
										<div className="flex items-center mt-1 text-xs">
											{todayChange >= 0 ? (
												<span className="text-green-600 flex items-center">
													<ArrowUpOutlined className="mr-1" />
													较昨日 +{todayChange.toFixed(0)}%
												</span>
											) : (
												<span className="text-red-600 flex items-center">
													<ArrowDownOutlined className="mr-1" />
													较昨日 {todayChange.toFixed(0)}%
												</span>
											)}
										</div>
									</div>
									<div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
										<ClockCircleOutlined className="text-green-600 text-xl" />
									</div>
								</div>
							</CardBody>
						</Card>
</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
							<CardBody className="py-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-gray-500 mb-1">总 Token 消耗</p>
										<p className="text-2xl font-bold text-gray-800">
											{(stats.totalTokens / 1000).toFixed(1)}K
										</p>
										<p className="text-xs text-gray-400 mt-1">
											输入 {(stats.promptTokens / 1000).toFixed(1)}K / 输出{' '}
											{(stats.completionTokens / 1000).toFixed(1)}K
										</p>
									</div>
									<div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
										<FireOutlined className="text-purple-600 text-xl" />
									</div>
								</div>
							</CardBody>
						</Card>
</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
						<CardBody className="py-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-gray-500 mb-1">成功率</p>
									<p className="text-2xl font-bold text-gray-800">
										{stats.successRate.toFixed(1)}%
									</p>
									<p className="text-xs text-gray-400 mt-1">
										本月 {stats.monthSessions} 次会话
									</p>
								</div>
								<div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
									<CheckCircleOutlined className="text-orange-600 text-xl" />
								</div>
							</div>
						</CardBody>
					</Card>
				</Col>
				</Row>

				<Row gutter={[16, 16]}>
					{/* Sessions Chart */}
					<Col xs={24} lg={16}>
						<Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
							<CardHeader className="flex justify-between items-center pb-2">
								<h2 className="text-lg font-semibold text-gray-800">
									会话趋势（近 7 天）
								</h2>
								<Chip size="sm" variant="flat" color="primary">
									每周
								</Chip>
							</CardHeader>
							<CardBody className="overflow-hidden">
								{dailyData.length > 0 ? (
									<div className="h-64 w-full relative">
										{(() => {
											const height = 200;
											const width = 1000; // Virtual width for SVG viewBox
											const padding = 20;
											const contentWidth = width - padding * 2;
											const contentHeight = height - padding * 2;

											const points = dailyData.map((d, i) => ({
												x:
													padding + (i / (dailyData.length - 1)) * contentWidth,
												y:
													padding +
													contentHeight -
													(d.count / maxCalls) * contentHeight,
												value: d.count,
												label: d.day,
											}));

											const pathD = createSmoothPath(points);
											const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

											return (
												<svg
													viewBox={`0 0 ${width} ${height + 30}`}
													className="w-full h-full overflow-visible"
													preserveAspectRatio="none"
													role="img"
													aria-label="Activity chart"
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
																stopColor="#6366F1"
																stopOpacity="0.3"
															/>
															<stop
																offset="100%"
																stopColor="#6366F1"
																stopOpacity="0"
															/>
														</linearGradient>
													</defs>

													{/* Grid lines */}
													{[0, 0.25, 0.5, 0.75, 1].map((t) => (
														<line
															key={t}
															x1={padding}
															y1={padding + contentHeight * t}
															x2={width - padding}
															y2={padding + contentHeight * t}
															stroke="#E5E7EB"
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
														stroke="#6366F1"
														strokeWidth="3"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>

													{/* Points and Labels */}
													{points.map((p, _i) => (
														<g key={`${p.x}-${p.y}`} className="group">
															{/* Hover area for tooltip */}
															<rect
																x={p.x - 20}
																y={0}
																width={40}
																height={height}
																fill="transparent"
																className="cursor-pointer"
															/>

															{/* Point */}
															<circle
																cx={p.x}
																cy={p.y}
																r="4"
																className="fill-white stroke-indigo-500 stroke-2 transition-all duration-200"
																style={{ transformOrigin: 'center' }}
															/>
															{/* Hover effect using SVG mask/filter or simpler inline style approach since Tailwind can't animate 'r' attribute directly effectively without plugin */}
															<circle
																cx={p.x}
																cy={p.y}
																r="6"
																className="fill-white stroke-indigo-500 stroke-2 opacity-0 group-hover:opacity-100 transition-opacity"
																pointerEvents="none"
															/>

															{/* Tooltip */}
															<foreignObject
																x={p.x - 40}
																y={p.y - 45}
																width="80"
																height="40"
																className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
															>
																<div className="bg-gray-800 text-white text-xs px-2 py-1 rounded text-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
																	{p.value} 次
																</div>
															</foreignObject>

															{/* X-axis Label */}
															<text
																x={p.x}
																y={height + 25}
																textAnchor="middle"
																className="text-xs fill-gray-500 font-medium"
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
									<div className="h-48 flex items-center justify-center text-gray-400">
										暂无数据
									</div>
								)}
							</CardBody>
						</Card>
					</Col>

					{/* Model Usage */}
					<Col xs={24} lg={8}>
						<Card className="h-full bg-gradient-to-br from-fuchsia-50 to-white border-fuchsia-100 shadow-sm">
							<CardHeader className="pb-2">
								<h2 className="text-lg font-semibold text-gray-800">
									模型使用情况
								</h2>
							</CardHeader>
							<CardBody>
								{modelUsageWithPercentage.length > 0 ? (
									<div className="space-y-4">
										{modelUsageWithPercentage.map((model) => (
											<div key={model.model}>
												<div className="flex justify-between text-sm mb-1">
													<span className="text-gray-700">{model.model}</span>
													<span className="text-gray-500">
														{model.count.toLocaleString()} 次
													</span>
												</div>
												<Progress
													value={model.percentage}
													color={getModelColor(model.model)}
													size="sm"
													className="h-2"
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

				{/* Bottom Row: Language Stats, User Ranking, Activity Log */}
				<Row gutter={[16, 16]}>
					{/* Language Stats (Merged) */}
					<Col xs={24} lg={8}>
						<Card className="h-full bg-gradient-to-br from-cyan-50 to-white border-cyan-100 shadow-sm">
							<CardHeader className="pb-2">
								<h2 className="text-lg font-semibold text-gray-800">
									编程语言分布
								</h2>
							</CardHeader>
							<CardBody>
								{stats.languageUsage.length > 0 ? (
									<div className="flex flex-col h-full gap-4">
										{/* Donut Chart */}
										<div className="relative w-40 h-40 mx-auto flex-shrink-0">
											<svg
												viewBox="0 0 100 100"
												className="w-full h-full transform -rotate-90"
												role="img"
												aria-label="Language usage chart"
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
																className="transition-all hover:opacity-80 cursor-pointer"
															>
																<title>
																	{lang.language}: {lang.count} (
																	{percentage.toFixed(1)}%)
																</title>
															</circle>
														);
													});
												})()}
											</svg>
											<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
												<span className="text-2xl font-bold text-gray-800">
													{stats.languageUsage.length}
												</span>
												<span className="text-xs text-gray-500">语言</span>
											</div>
										</div>

										{/* List with Progress Bars */}
										<div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 max-h-60">
											{stats.languageUsage.slice(0, 8).map((lang, index) => {
												const total = stats.languageUsage.reduce(
													(sum, l) => sum + l.count,
													0,
												);
												const percentage = (lang.count / total) * 100;
												return (
													<div key={lang.language}>
														<div className="flex justify-between text-xs mb-1">
															<div className="flex items-center gap-1.5">
																<div
																	className="w-2 h-2 rounded-full"
																	style={{
																		backgroundColor: getLanguageColor(
																			lang.language,
																			index,
																		),
																	}}
																/>
																<span className="text-gray-700 font-medium">
																	{lang.language}
																</span>
															</div>
															<span className="text-gray-500">
																{percentage.toFixed(1)}%
															</span>
														</div>
														<div className="w-full bg-gray-100 rounded-full h-1.5">
															<div
																className="h-1.5 rounded-full transition-all"
																style={{
																	width: `${percentage}%`,
																	backgroundColor: getLanguageColor(
																		lang.language,
																		index,
																	),
																}}
															/>
														</div>
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
						<Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm h-full">
							<CardHeader className="flex justify-between items-center pb-2">
								<h2 className="text-lg font-semibold text-gray-800">
									用户排行
								</h2>
								<Chip
									size="sm"
									variant="flat"
									color="warning"
									startContent={<TrophyOutlined />}
								>
									Top 10
								</Chip>
							</CardHeader>
							<CardBody className="overflow-y-auto max-h-[450px] custom-scrollbar">
								{stats.userRanking.length > 0 ? (
									<div className="space-y-3">
										{stats.userRanking.map((user, index) => (
											<div
												key={user.userId}
												className="flex items-center justify-between p-2.5 bg-white/60 border border-amber-100 rounded-lg hover:bg-white transition-all shadow-sm"
											>
												<div className="flex items-center gap-2">
													<div className="relative flex-shrink-0">
														<Avatar
															size="sm"
															name={user.name}
															className={
																index === 0
																	? 'bg-yellow-100 text-yellow-600'
																	: index === 1
																		? 'bg-gray-200 text-gray-600'
																		: index === 2
																			? 'bg-orange-100 text-orange-600'
																			: 'bg-blue-100 text-blue-600'
															}
														/>
														{index < 3 && (
															<CrownOutlined
																className={`absolute -top-2 -right-1 text-[10px] ${
																	index === 0
																		? 'text-yellow-500'
																		: index === 1
																			? 'text-gray-400'
																			: 'text-orange-400'
																}`}
															/>
														)}
													</div>
													<div className="min-w-0">
														<p className="font-medium text-gray-800 text-sm truncate max-w-[100px]">
															{user.name}
														</p>
														<p className="text-[10px] text-gray-400 truncate max-w-[100px]">
															{user.sessionCount} 次会话
														</p>
													</div>
												</div>
												<div className="text-right flex-shrink-0">
													<Chip
														size="sm"
														variant="flat"
														className="h-6 text-xs"
													>
														{(user.totalTokens / 1000).toFixed(0)}k
													</Chip>
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
						<Card className="bg-gradient-to-br from-slate-50 to-white border-slate-100 shadow-sm h-full">
							<CardHeader className="flex justify-between items-center pb-2">
								<h2 className="text-lg font-semibold text-gray-800">
									最近会话
								</h2>
								<Button size="sm" variant="light" isIconOnly color="primary">
									<HistoryOutlined />
								</Button>
							</CardHeader>
							<CardBody className="overflow-y-auto max-h-[450px] custom-scrollbar">
								{stats.recentSessions.length > 0 ? (
									<Timeline
										className="mt-2"
										items={stats.recentSessions.map((session) => ({
											color: session.success ? 'green' : 'red',
											dot: session.success ? (
												<CheckCircleOutlined className="text-green-500 text-xs" />
											) : (
												<CloseCircleOutlined className="text-red-500 text-xs" />
											),
											children: (
												<div className="pb-3 pl-1">
													<div className="mb-1">
														<span className="text-gray-800 text-sm font-medium line-clamp-2 leading-snug">
															{session.userPrompt}
														</span>
													</div>
													<div className="flex flex-wrap gap-1 mt-1.5">
														<span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
															{session.model}
														</span>
														<span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 flex items-center gap-1">
															<FieldTimeOutlined />{' '}
															{formatDuration(session.duration)}
														</span>
														<span className="text-[10px] text-gray-400 ml-auto">
															{formatTimeAgo(session.timestamp)}
														</span>
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
