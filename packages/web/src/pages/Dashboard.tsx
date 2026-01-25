import {
	ArrowDownOutlined,
	ArrowUpOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	CloseCircleOutlined,
	CloudDownloadOutlined,
	CopyOutlined,
	FireOutlined,
	HistoryOutlined,
	MoreOutlined,
	ReloadOutlined,
	ThunderboltOutlined,
	TrophyOutlined,
	UserOutlined,
} from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
	Avatar,
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	Progress,
	Skeleton,
} from '@heroui/react';
import { MultiFileDiff } from '@pierre/diffs/react';
import { Col, Row, Timeline, DatePicker, Tooltip } from 'antd';
import { Fragment, useEffect, useState } from 'react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip as RechartsTooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

const { RangePicker } = DatePicker;

// Mock Data
const mockStats: DashboardStats = {
	totalSessions: 12580,
	todaySessions: 142,
	yesterdaySessions: 128,
	thisWeekSessions: 856,
	lastWeekSessions: 790,
	monthSessions: 3420,
	totalTokens: 15600000,
	promptTokens: 6500000,
	completionTokens: 9100000,
	successRate: 98.5,
	modelUsage: [
		{ model: 'GLM-4.7', count: 450, tokens: 5000000 },
		{ model: 'MiniMax M2', count: 320, tokens: 3000000 },
		{ model: 'Kimi k2', count: 280, tokens: 2000000 },
		{ model: 'DeepSeek', count: 150, tokens: 1000000 },
	],
	dailySessions: Array.from({ length: 7 }, (_, i) => ({
		date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
		count: 100 + Math.floor(Math.random() * 100),
	})),
	recentSessions: Array.from({ length: 10 }, (_, i) => ({
		id: `session-${i}`,
		sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
		userName: ['张三', '李四', '王五', '赵六', '钱七'][i % 5],
		model: ['GLM-4.7', 'MiniMax M2', 'deepseek-coder'][i % 3],
		messages: i % 2 === 0 ? [
			{
				role: 'user',
				content: ['优化这个组件', '解释这段错误日志', '生成单元测试', '优化 SQL 查询', '如何实现防抖函数'][i % 5]
			},
			{
				role: 'assistant',
				content: i % 5 === 0
					? `这是一个优化后的组件实现，使用了 React Hooks 和性能优化技巧：

\`\`\`typescript
import { memo, useCallback } from 'react';

interface OptimizedComponentProps {
  data: string[];
  onUpdate: (id: string) => void;
}

export const OptimizedComponent = memo(({ data, onUpdate }: OptimizedComponentProps) => {
  const handleUpdate = useCallback((id: string) => {
    onUpdate(id);
  }, [onUpdate]);

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} onClick={() => handleUpdate(item)}>
          {item}
        </div>
      ))}
    </div>
  );
});
\`\`\`

主要优化点：
1. 使用 \`memo\` 避免不必要的重渲染
2. 使用 \`useCallback\` 稳定函数引用
3. 添加明确的类型注解`
					: i % 5 === 1
					? `这个错误日志表明数据库连接超时，建议检查：

\`\`\`javascript
// 常见的连接池配置
module.exports = {
  database: {
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    timeout: 5000
  }
};
\`\`\`

排查步骤：
1. 检查网络连接是否稳定
2. 增加连接池超时时间
3. 监控数据库服务器负载
4. 考虑添加重试机制`
					: i % 5 === 2
					? `以下是为您生成的完整单元测试，覆盖了所有边界情况：

\`\`\`typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    service = new UserService(mockRepo);
  });

  it('should return user when found', async () => {
    const user = { id: '1', name: 'John' };
    mockRepo.findById.mockResolvedValue(user);

    const result = await service.getUser('1');
    expect(result).toEqual(user);
  });

  it('should throw error when user not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(service.getUser('999')).rejects.toThrow('User not found');
  });

  it('should validate input', async () => {
    await expect(service.getUser('')).rejects.toThrow('Invalid ID');
  });
});
\`\`\``
					: i % 5 === 3
					? `这个 SQL 查询可以通过添加索引和优化 JOIN 顺序来提升性能：

\`\`\`sql
-- 原查询
SELECT u.name, o.amount, p.title
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN products p ON o.product_id = p.id
WHERE u.status = 'active';

-- 优化后
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_orders_user_id ON orders(user_id);

SELECT u.name, o.amount, p.title
FROM users u
INDEXED BY idx_users_status
JOIN orders o INDEXED BY idx_orders_user_id ON u.id = o.user_id
JOIN products p ON o.product_id = p.id
WHERE u.status = 'active';
\`\`\`

性能提升约 40-60%`
					: `防抖函数的实现非常简单，这里提供两种方式：

\`\`\`typescript
// 方式一：使用 Lodash
import { debounce } from 'lodash';

const search = debounce((query: string) => {
  console.log('Searching for:', query);
}, 500);

// 方式二：原生实现
function debouce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const search = debouce((query: string) => {
  console.log('Searching for:', query);
}, 500);
\`\`\`

推荐使用 Lodash 的实现，它经过充分测试且功能更完善。`
			}
		] : [
			{
				role: 'user',
				content: '帮我写一个 React 计数器组件'
			},
			{
				role: 'assistant',
				content: `这是一个基础的 React 计数器组件：

\`\`\`tsx
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}
\`\`\``
			},
			{
				role: 'user',
				content: '能添加重置功能吗？'
			},
			{
				role: 'assistant',
				content: `当然可以，添加重置功能：

\`\`\`tsx
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  const reset = () => setCount(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
\`\`\`

现在你可以点击 Reset 按钮将计数器重置为 0。`
			}
		],
		success: Math.random() > 0.1,
		totalTokens: 1000 + Math.floor(Math.random() * 2000),
		duration: 2000 + Math.floor(Math.random() * 5000),
		timestamp: new Date(Date.now() - i * 3600000).toISOString(),
	})),
	userRanking: Array.from({ length: 5 }, (_, i) => ({
		userId: `user-${i}`,
		name: ['张三', '李四', '王五', '赵六', '钱七'][i],
		email: `user${i}@example.com`,
		sessionCount: 500 - i * 50,
		totalTokens: 1000000 - i * 100000,
	})),
	languageUsage: [
		{ language: 'TypeScript', count: 450 },
		{ language: 'Python', count: 320 },
		{ language: 'Rust', count: 180 },
		{ language: 'Go', count: 120 },
		{ language: 'JavaScript', count: 90 },
	]
};

const heatmapData = Array.from({ length: 365 }, (_, i) => {
	const date = new Date();
	date.setDate(date.getDate() - (364 - i));
	const base = Math.random() > 0.8 ? Math.floor(Math.random() * 20) : Math.floor(Math.random() * 5); 
	return {
		date: date.toISOString().split('T')[0],
		count: base,
	};
});

const adoptionData = {
	totalGenerated: 15420,
	totalAccepted: 12850,
	acceptanceRate: 83.3,
	byLanguage: [
		{ language: 'TypeScript', rate: 92, total: 8500 },
		{ language: 'Java', rate: 78, total: 4200 },
		{ language: 'CSS', rate: 65, total: 2720 },
	],
};

const recentAdoptedCode = [
	{
		id: '1',
		language: 'TypeScript',
		snippet: 'const { data } = await api.get("/users");',
		time: '2分钟前',
		user: '张三',
		model: 'GLM-4.7',
		before: `import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/users');
        const result = await response.json();
        setUsers(result.data || []);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}`,
		after: `import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function UsersList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get<User[]>('/users');
      return response.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading users</div>;

  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}`,
	},
	{
		id: '2',
		language: 'Python',
		snippet: 'df = pd.read_csv("data.csv")',
		time: '5分钟前',
		user: '李四',
		model: 'GLM-4.7',
		before: `import csv
from typing import List, Dict

def read_csv_file(filepath: str) -> List[Dict]:
    result = []
    with open(filepath, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            result.append(dict(row))
    return result

def process_data(data: List[Dict]) -> Dict:
    total = len(data)
    ages = [int(row.get('age', 0)) for row in data if row.get('age')]
    avg_age = sum(ages) / len(ages) if ages else 0
    return {
        'total_records': total,
        'average_age': round(avg_age, 2),
        'valid_ages': len(ages)
    }

if __name__ == '__main__':
    data = read_csv_file('data.csv')
    stats = process_data(data)
    print(stats)`,
		after: `import pandas as pd

def process_data(filepath: str) -> dict:
    df = pd.read_csv(filepath)
    
    stats = {
        'total_records': len(df),
        'average_age': df['age'].mean().round(2),
        'valid_ages': df['age'].notna().sum(),
        'age_distribution': df['age'].describe().to_dict()
    }
    
    return stats

if __name__ == '__main__':
    stats = process_data('data.csv')
    print(stats)`,
	},
	{
		id: '3',
		language: 'Go',
		snippet: 'func main() { fmt.Println("Hello") }',
		time: '12分钟前',
		user: '王五',
		model: 'deepseek-coder',
		before: `package main

import (
    "fmt"
    "net/http"
    "encoding/json"
)

type User struct {
    ID    int    \`json:"id"\`
    Name  string \`json:"name"\`
    Email string \`json:"email"\`
}

func main() {
    http.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
        users := []User{
            {ID: 1, Name: "Alice", Email: "alice@example.com"},
            {ID: 2, Name: "Bob", Email: "bob@example.com"},
        }
        
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(users)
    })
    
    fmt.Println("Server starting on :8080")
    http.ListenAndServe(":8080", nil)
}`,
		after: `package main

import (
    "github.com/gin-gonic/gin"
)

type User struct {
    ID    int    \`json:"id"\`
    Name  string \`json:"name"\`
    Email string \`json:"email"\`
}

func main() {
    r := gin.Default()
    
    r.GET("/users", func(c *gin.Context) {
        users := []User{
            {ID: 1, Name: "Alice", Email: "alice@example.com"},
            {ID: 2, Name: "Bob", Email: "bob@example.com"},
        }
        c.JSON(200, users)
    })
    
    r.Run(":8080")
}`,
	},
];

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
		userName: string;
		model: string;
		messages: {
			role: 'user' | 'assistant';
			content: string;
		}[];
		success: boolean;
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

function formatMessageContent(content: string): (string | JSX.Element)[] {
	const parts = content.split(/```(\w+)?\n([\s\S]*?)```/g);
	const result: (string | JSX.Element)[] = [];

	for (let i = 0; i < parts.length; i++) {
		if (i % 3 === 0 && parts[i]) {
			const textParts = parts[i].split('\n\n');
			textParts.forEach((text, textIdx) => {
				if (text.trim()) {
					result.push(
						<p key={`text-${i}-${textIdx}`} className="mb-2">
							{text.split('\n').map((line, lineIdx) => (
								<Fragment key={lineIdx}>
									{lineIdx > 0 && <br />}
									{line}
								</Fragment>
							))}
						</p>
					);
				}
			});
		} else if (i % 3 === 2) {
			const code = parts[i];
			const lang = parts[i - 1] || 'plaintext';
			result.push(
				<div key={`code-${i}`} className="relative group my-2">
					<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
						<CopyOutlined className="text-gray-400 hover:text-gray-600 cursor-pointer" />
					</div>
					<SyntaxHighlighter
						language={lang}
						style={vscDarkPlus}
						customStyle={{
							borderRadius: '0.5rem',
							fontSize: '0.875rem',
							lineHeight: '1.625',
							margin: 0,
						}}
						wrapLongLines={true}
					>
						{code}
					</SyntaxHighlighter>
				</div>
			);
		}
	}

	return result;
}

const modelColors: Record<
	string,
	'primary' | 'secondary' | 'success' | 'warning' | 'danger'
> = {
	'MiniMax M2': 'primary',
	'claude-3-sonnet': 'secondary',
	'claude-3-haiku': 'success',
	'gpt-4': 'warning',
	'GLM-4.7': 'danger',
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

// 统一的蓝色系渐变色板（从深到浅，数据大的用深色）
const blueGradientColors = [
	'#2563EB', // blue-600
	'#3B82F6', // blue-500
	'#60A5FA', // blue-400
	'#93C5FD', // blue-300
	'#BFDBFE', // blue-200
	'#DBEAFE', // blue-100
	'#EFF6FF', // blue-50
	'#F8FAFC', // slate-50
];

function getLanguageColor(language: string, index: number): string {
	// 使用统一的蓝色渐变
	return blueGradientColors[index % blueGradientColors.length];
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
	if (minutes < 60) return `${minutes}分钟前`;
	if (hours < 24) return `${hours}小时前`;
	return time.toLocaleDateString('zh-CN');
}

// Simplified Skeleton
const DashboardSkeleton = () => (
	<div className="space-y-6 animate-pulse">
		<div className="flex justify-between items-center mb-6">
			<Skeleton className="rounded-lg w-32 h-8" />
			<div className="flex gap-2">
				<Skeleton className="rounded-lg w-32 h-9" />
				<Skeleton className="rounded-lg w-9 h-9" />
			</div>
		</div>
		<Row gutter={[16, 16]}>
			{[1, 2, 3, 4].map((i) => (
				<Col xs={24} sm={12} xl={6} key={i}>
					<Skeleton className="rounded-2xl h-24 w-full" />
				</Col>
			))}
		</Row>
		<div className="h-96 bg-gray-100 rounded-2xl" />
	</div>
);

export default function Dashboard() {
	const { user } = useAuth();
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [diffModalOpen, setDiffModalOpen] = useState(false);
	const [selectedDiff, setSelectedDiff] = useState<typeof recentAdoptedCode[0] | null>(null);
	const [chatModalOpen, setChatModalOpen] = useState(false);
	const [selectedSession, setSelectedSession] = useState<typeof mockStats.recentSessions[0] | null>(null);

	useEffect(() => {
		// Use mock data instead of API call
		setStats(mockStats);
		setLoading(false);
	}, []);

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-gray-500">
				<CloseCircleOutlined className="text-2xl text-red-500" />
				<p>{error}</p>
				<Button size="sm" onPress={() => window.location.reload()}>重试</Button>
			</div>
		);
	}

	if (loading || !stats) return <DashboardSkeleton />;

	const todayChange = stats.yesterdaySessions > 0
		? ((stats.todaySessions - stats.yesterdaySessions) / stats.yesterdaySessions) * 100
		: stats.todaySessions > 0 ? 100 : 0;

	const weekChange = stats.lastWeekSessions > 0
		? ((stats.thisWeekSessions - stats.lastWeekSessions) / stats.lastWeekSessions) * 100
		: stats.thisWeekSessions > 0 ? 100 : 0;

	const dailyData = (() => {
		const sessionMap = new Map(stats.dailySessions.map((d) => [new Date(d.date).toDateString(), d.count]));
		const result = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			result.push({ day: dayNames[date.getDay()], count: sessionMap.get(date.toDateString()) || 0 });
		}
		return result;
	})();

	const totalModelCalls = stats.modelUsage.reduce((sum, m) => sum + m.count, 0);
	const modelUsageWithPercentage = stats.modelUsage.map((m) => ({
		...m,
		percentage: totalModelCalls > 0 ? (m.count / totalModelCalls) * 100 : 0,
	}));

	return (
		<div className="space-y-6 fade-in p-2 md:p-4">
			{/* Top Bar */}
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
				<div className="flex items-center gap-2">
					<RangePicker className="h-9 border-none bg-white rounded-lg shadow-sm hover:bg-gray-50 text-sm" />
					<Button isIconOnly size="sm" className="bg-white text-gray-500 shadow-sm rounded-lg">
						<CloudDownloadOutlined />
					</Button>
					<Button isIconOnly size="sm" color="primary" className="shadow-sm rounded-lg" onPress={() => window.location.reload()}>
						<ReloadOutlined />
					</Button>
				</div>
			</div>

			{/* KPI Cards */}
			<Row gutter={[16, 16]}>
				{[
					{ 
						title: '总会话数', 
						value: stats.totalSessions.toLocaleString(), 
						icon: <ThunderboltOutlined />, 
						change: weekChange, 
						period: '较上周', 
						color: 'blue' 
					},
					{ 
						title: '今日会话', 
						value: stats.todaySessions, 
						icon: <ClockCircleOutlined />, 
						change: todayChange, 
						period: '较昨日', 
						color: 'green' 
					},
					{ 
						title: 'Token 消耗', 
						value: `${(stats.totalTokens / 1000).toFixed(1)}k`, 
						icon: <FireOutlined />, 
						meta: `输入: ${(stats.promptTokens/1000).toFixed(1)}k / 输出: ${(stats.completionTokens/1000).toFixed(1)}k`, 
						color: 'purple' 
					},
					{ 
						title: '请求成功率', 
						value: `${stats.successRate.toFixed(1)}%`, 
						icon: <CheckCircleOutlined />, 
						progress: stats.successRate, 
						color: 'orange' 
					},
				].map((item, idx) => (
					<Col xs={24} sm={12} xl={6} key={idx}>
						<Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 h-full rounded-2xl bg-white/80 backdrop-blur-sm">
							<CardBody className="p-5 flex flex-col justify-between h-full gap-4">
								<div className="flex justify-between items-start">
									<div>
										<p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{item.title}</p>
										<p className="text-3xl font-bold text-gray-800 mt-1">{item.value}</p>
									</div>
									<div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${item.color}-50 text-${item.color}-500`}>
										{item.icon}
									</div>
								</div>
								
								{item.change !== undefined && (
									<div className="flex items-center text-sm">
										<span className={`flex items-center font-medium ${item.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
											{item.change >= 0 ? <ArrowUpOutlined className="mr-1" /> : <ArrowDownOutlined className="mr-1" />}
											{Math.abs(item.change).toFixed(0)}%
										</span>
										<span className="text-gray-400 ml-1.5">{item.period}</span>
									</div>
								)}

								{item.meta && (
									<div className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded w-fit">
										{item.meta}
									</div>
								)}

								{item.progress !== undefined && (
									<div className="w-full bg-gray-100 rounded-full h-1 mt-1">
										<div className="bg-orange-400 h-1 rounded-full" style={{ width: `${item.progress}%` }} />
									</div>
								)}
							</CardBody>
						</Card>
					</Col>
				))}
			</Row>

			{/* Row 2: Trend & Code Adoption */}
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={16}>
					<Card className="border-none shadow-sm rounded-2xl h-full">
						<CardHeader className="px-6 pt-5 pb-0 flex justify-between">
							<div>
								<h2 className="text-base font-bold text-gray-800">趋势分析</h2>
								<p className="text-xs text-gray-400">近 7 天会话活跃度</p>
							</div>
						</CardHeader>
						<CardBody className="overflow-hidden px-4 pb-4 pt-2 flex flex-col">
							{dailyData.length > 0 ? (
								<div className="w-full flex-1 min-h-[140px]">
									<ResponsiveContainer width="100%" height="100%">
										<AreaChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
											<defs>
												<linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
													<stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
													<stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
												</linearGradient>
											</defs>
											<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
											<XAxis
												dataKey="day"
												axisLine={false}
												tickLine={false}
												tick={{ fontSize: 12, fill: '#9CA3AF' }}
												dy={10}
											/>
											<YAxis hide={true} />
											<RechartsTooltip
												contentStyle={{
													backgroundColor: 'rgba(31, 41, 55, 0.9)',
													border: 'none',
													borderRadius: '6px',
													padding: '4px 8px',
													color: '#fff',
													fontSize: '12px',
												}}
												itemStyle={{ color: '#fff' }}
												cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4' }}
												formatter={(value: number) => [`${value} 次`, '']}
												labelStyle={{ display: 'none' }}
											/>
											<Area
												type="monotone"
												dataKey="count"
												stroke="#3B82F6"
												strokeWidth={2}
												fillOpacity={1}
												fill="url(#colorCount)"
												activeDot={{ r: 4, strokeWidth: 0, fill: '#3B82F6' }}
											/>
										</AreaChart>
									</ResponsiveContainer>
								</div>
							) : (
								<div className="flex items-center justify-center h-full text-gray-300 text-sm">暂无数据</div>
							)}
						</CardBody>
					</Card>
				</Col>
				<Col xs={24} lg={8}>
					<Card className="h-full border-none shadow-sm rounded-2xl overflow-hidden">
						<CardHeader className="px-5 pt-5 pb-0 flex justify-between items-center">
							<h2 className="text-base font-bold text-gray-800">代码采纳情况</h2>
							<Chip size="sm" variant="flat" color="primary" className="h-6 text-xs font-bold shadow-sm">
								{adoptionData.acceptanceRate}%
							</Chip>
						</CardHeader>
						<CardBody className="p-5">
							<div className="space-y-3 mb-5">
								{adoptionData.byLanguage.map((item, idx) => (
									<div key={item.language} className="flex items-center gap-3 group">
										<span className="text-xs font-mono text-gray-600 w-20 font-medium">{item.language}</span>
										<div className="flex-1 bg-white/70 rounded-full h-2 overflow-hidden shadow-inner">
											<div
												className="h-full rounded-full transition-all duration-700 group-hover:brightness-110"
												style={{
													width: `${item.rate}%`,
													background: `linear-gradient(to right, ${blueGradientColors[idx + 3]}, ${blueGradientColors[idx + 4]})`
												}}
											/>
										</div>
										<span className="text-xs font-bold text-gray-700 w-9 text-right tabular-nums">{item.rate}%</span>
									</div>
								))}
							</div>
							<div className="pt-4 border-t border-blue-100">
<p className="text-xs text-gray-500 uppercase mb-3 font-semibold tracking-wide flex items-center gap-1.5">
								<CheckCircleOutlined className="text-blue-500" />
								最近采纳
							</p>
							<div className="space-y-2">
								{recentAdoptedCode.map((c) => (
									<div key={c.id} onClick={() => { setSelectedDiff(c); setDiffModalOpen(true); }} className="flex justify-between items-center text-xs bg-white/80 p-2.5 rounded-lg border border-blue-100/50 hover:border-blue-200 cursor-pointer transition-colors group">
										<code className="text-gray-700 truncate max-w-[150px] font-medium group-hover:text-blue-700 transition-colors">{c.snippet}</code>
										<span className="text-gray-400 whitespace-nowrap ml-2 text-[10px]">{c.time}</span>
									</div>
								))}
							</div>
							</div>
						</CardBody>
					</Card>
				</Col>
			</Row>

			{/* Row 3: Heatmap & Model Distribution */}
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={15}>
					<Card className="border-none shadow-sm rounded-2xl h-full">
						<CardHeader className="px-6 pt-4 pb-1 flex justify-between items-center">
							<h2 className="text-base font-bold text-gray-800">年度活跃热力图</h2>
							<div className="flex items-center gap-1.5 text-xs text-gray-400">
								<span>少</span>
								<div className="flex gap-[2px]">
									<div className="w-4 h-4 rounded-sm bg-gray-100" />
									<div className="w-4 h-4 rounded-sm bg-green-200" />
									<div className="w-4 h-4 rounded-sm bg-green-400" />
									<div className="w-4 h-4 rounded-sm bg-green-600" />
								</div>
								<span>多</span>
							</div>
						</CardHeader>
						<CardBody className="px-6 py-3 flex flex-col justify-center flex-1">
							<div className="flex gap-2 w-full overflow-x-auto custom-scrollbar">
								<div className="flex flex-col justify-around text-[10px] text-gray-400 w-4 flex-shrink-0">
									<span>一</span>
									<span>三</span>
									<span>五</span>
									<span>日</span>
								</div>
								<div className="flex-1 grid grid-rows-7 grid-flow-col gap-[3px] min-w-fit">
									{heatmapData.map((d, i) => (
										<Tooltip key={i} title={`${d.date}: ${d.count} 次`} mouseEnterDelay={0} mouseLeaveDelay={0}>
											<div className={`w-4 h-4 rounded-sm transition-all hover:scale-110 hover:z-10 cursor-pointer ${
												d.count === 0 ? 'bg-gray-100' :
												d.count < 3 ? 'bg-green-200' :
												d.count < 6 ? 'bg-green-300' :
												d.count < 10 ? 'bg-green-400' :
												'bg-green-600'
											}`} />
										</Tooltip>
									))}
								</div>
							</div>
						</CardBody>
					</Card>
				</Col>
				<Col xs={24} lg={9}>
					<Card className="h-full border-none shadow-sm rounded-2xl overflow-hidden">
						<CardHeader className="px-5 pt-4 pb-2">
							<div>
								<h2 className="text-base font-bold text-gray-800">模型分布</h2>
								<p className="text-xs text-gray-400 mt-0.5">调用次数统计</p>
							</div>
						</CardHeader>
						<CardBody className="px-5 pb-4 pt-0">
							{/* Model Stats */}
							<div className="space-y-2.5">
								{modelUsageWithPercentage.map((m, i) => {
									const color = blueGradientColors[i % blueGradientColors.length];
									return (
										<div key={m.model} className="group">
											<div className="flex items-center justify-between mb-1.5">
												<div className="flex items-center gap-2">
													<div
														className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform"
														style={{ backgroundColor: color }}
													/>
													<span className="text-sm font-medium text-gray-700 truncate" title={m.model}>
														{m.model}
													</span>
												</div>
												<div className="flex items-center gap-2 ml-2">
													<span className="text-xs text-gray-400 font-mono">{m.count}次</span>
													<span className="text-xs font-bold text-gray-800 w-10 text-right tabular-nums">{m.percentage.toFixed(1)}%</span>
												</div>
											</div>
											<div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
												<div
													className="h-full rounded-full transition-all duration-700 group-hover:brightness-110"
													style={{
														width: `${m.percentage}%`,
														backgroundColor: color
													}}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</CardBody>
					</Card>
				</Col>
			</Row>

			{/* Row 4: Hot Languages & Recent Activity & Active Users */}
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={8}>
					<Card className="border-none shadow-sm rounded-2xl h-full">
						<CardHeader className="px-5 pt-5 pb-0 flex justify-between">
							<h2 className="text-base font-bold text-gray-800">热门语言</h2>
							<MoreOutlined className="text-gray-400 rotate-90" />
						</CardHeader>
						<CardBody className="p-5">
							<div className="space-y-4">
								{stats.languageUsage.slice(0, 5).map((lang, idx) => {
									const total = stats.languageUsage.reduce((acc, curr) => acc + curr.count, 0);
									const percent = ((lang.count / total) * 100).toFixed(1);
									return (
										<div key={lang.language} className="group">
											<div className="flex justify-between items-center mb-1">
												<div className="flex items-center gap-2">
													<div className={`
														w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold
														${idx === 0 ? 'bg-blue-600 text-white' :
														  idx === 1 ? 'bg-blue-400 text-white' :
														  idx === 2 ? 'bg-blue-300 text-blue-800' :
														  'bg-blue-100 text-blue-600'}
													`}>
														{idx + 1}
													</div>
													<span className="text-sm font-medium text-gray-700">{lang.language}</span>
												</div>
												<div className="text-right">
													<span className="text-xs font-bold text-gray-800">{percent}%</span>
												</div>
											</div>
											<div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
												<div
													className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
													style={{
														width: `${percent}%`,
														backgroundColor: getLanguageColor(lang.language, idx)
													}}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</CardBody>
					</Card>
				</Col>
				<Col xs={24} lg={8}>
					<Card className="border-none shadow-sm rounded-2xl h-full">
						<CardHeader className="px-6 pt-5 pb-0 flex justify-between items-center">
							<h2 className="text-base font-bold text-gray-800">最近活动</h2>
							<Button size="sm" variant="light" isIconOnly><HistoryOutlined /></Button>
						</CardHeader>
						<CardBody className="p-6">
<Timeline
							pending={false}
							className="mt-2"
							items={stats.recentSessions.slice(0, 5).map((s) => ({
								color: s.success ? 'green' : 'red',
								children: (
									<div className="group -mt-1 pb-4 cursor-pointer" onClick={() => { setSelectedSession(s); setChatModalOpen(true); }}>
										<div className="flex justify-between text-xs text-gray-400 mb-1">
											<span>{formatTimeAgo(s.timestamp)}</span>
											<span className="font-mono">#{s.sessionId.slice(-4)}</span>
										</div>
										<div className="text-sm text-gray-700 font-medium line-clamp-2 bg-gray-50 p-2.5 rounded border border-transparent group-hover:border-blue-300 group-hover:bg-blue-50 transition-colors">
											{s.messages[0]?.content}
										</div>
									</div>
								)
							}))}
						/>
						</CardBody>
					</Card>
				</Col>
				<Col xs={24} lg={8}>
					<Card className="border-none shadow-sm rounded-2xl h-full">
						<CardHeader className="px-6 pt-5 pb-0 flex justify-between items-center">
							<h2 className="text-base font-bold text-gray-800">活跃用户</h2>
							<TrophyOutlined className="text-yellow-500" />
						</CardHeader>
						<CardBody className="p-0 overflow-hidden">
							<div className="divide-y divide-gray-50">
								{stats.userRanking.slice(0, 5).map((u, i) => (
									<div key={u.userId} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
										<div className="flex items-center gap-3">
											<div className="relative">
												<Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} size="sm" />
												{i < 3 && <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white ${i===0?'bg-yellow-400':i===1?'bg-gray-300':'bg-orange-400'}`} />}
											</div>
											<div className="flex flex-col">
												<span className="text-sm font-bold text-gray-700">{u.name}</span>
												<span className="text-xs text-gray-400">{u.email}</span>
											</div>
										</div>
										<div className="text-right">
											<span className="block text-base font-bold text-gray-800">{u.sessionCount}</span>
											<span className="text-xs text-gray-400">会话</span>
										</div>
									</div>
								))}
							</div>
						</CardBody>
					</Card>
				</Col>
			</Row>

<Modal isOpen={diffModalOpen} onClose={() => setDiffModalOpen(false)} size="5xl" scrollBehavior="inside">
				<ModalContent>
					<ModalHeader className="flex flex-col gap-1">
						<span className="text-sm text-gray-500">代码差异对比</span>
						<span className="text-lg font-bold">{selectedDiff?.language}</span>
					</ModalHeader>
					<ModalBody>
						{selectedDiff && (
							<>
								<div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
									<div className="flex items-center gap-2">
										<UserOutlined className="text-gray-400" />
										<span className="text-sm font-medium text-gray-700">用户</span>
										<span className="text-sm text-gray-900">{selectedDiff.user}</span>
									</div>
									<div className="w-px h-4 bg-gray-300" />
									<div className="flex items-center gap-2">
										<TrophyOutlined className="text-blue-400" />
										<span className="text-sm font-medium text-gray-700">模型</span>
										<span className="text-sm text-gray-900">{selectedDiff.model}</span>
									</div>
									<div className="ml-auto">
										<span className="text-xs text-gray-400">{selectedDiff.time}</span>
									</div>
								</div>
								<MultiFileDiff
									oldFile={{
										name: 'before',
										contents: selectedDiff.before,
										lang: selectedDiff.language.toLowerCase() as any
									}}
									newFile={{
										name: 'after',
										contents: selectedDiff.after,
										lang: selectedDiff.language.toLowerCase() as any
									}}
								/>
							</>
						)}
					</ModalBody>
</ModalContent>
			</Modal>

			<Modal isOpen={chatModalOpen} onClose={() => setChatModalOpen(false)} size="4xl">
				<ModalContent>
					<ModalHeader className="flex flex-col gap-1 pb-4">
						<span className="text-sm text-gray-500">会话详情</span>
						<span className="text-lg font-bold">#{selectedSession?.sessionId.slice(-6)}</span>
					</ModalHeader>
					<ModalBody className="max-h-[70vh] overflow-y-auto">
						{selectedSession && (
							<div className="space-y-4">
								{selectedSession.messages.map((msg, idx) => (
									msg.role === 'user' ? (
										<div key={idx} className="flex justify-end">
											<div className="flex items-end gap-3 max-w-[70%]">
												<div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-3 rounded-2xl rounded-br-md shadow-lg shadow-blue-500/20">
													<div className="flex items-center gap-2 mb-2">
														<span className="text-xs font-medium text-blue-100">{selectedSession.userName}</span>
														<span className="text-xs text-blue-200">·</span>
														<span className="text-xs text-blue-200">{formatTimeAgo(selectedSession.timestamp)}</span>
													</div>
													<p className="text-sm leading-relaxed break-words">{msg.content}</p>
												</div>
												<Avatar size="sm" className="bg-blue-100 text-blue-600 border-2 border-white shadow-sm">
													<UserOutlined />
												</Avatar>
											</div>
										</div>
									) : (
										<div key={idx} className="flex justify-start">
											<div className="flex items-end gap-3 max-w-[80%]">
												<Avatar size="sm" className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-2 border-white shadow-sm">
													<TrophyOutlined />
												</Avatar>
												<div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-lg border border-gray-100 min-w-0 flex-1">
													<div className="flex items-center gap-2 mb-2 flex-wrap">
														<span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full whitespace-nowrap">{selectedSession.model}</span>
														<span className="text-xs text-gray-400 whitespace-nowrap">{formatTimeAgo(selectedSession.timestamp)}</span>
													</div>
													<div className="text-sm text-gray-800 leading-relaxed space-y-2 overflow-hidden">
														{formatMessageContent(msg.content)}
													</div>
												</div>
											</div>
										</div>
									)
								))}

								<div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-100">
									<div className="flex items-center gap-2 text-xs text-gray-500">
										<FireOutlined className="text-orange-400" />
										<span>{selectedSession.totalTokens.toLocaleString()} tokens</span>
									</div>
									<div className="flex items-center gap-2 text-xs text-gray-500">
										<ClockCircleOutlined className="text-blue-400" />
										<span>{formatDuration(selectedSession.duration)}</span>
									</div>
									<div className="flex items-center gap-2 text-xs text-gray-500">
										{selectedSession.success ? (
											<>
												<CheckCircleOutlined className="text-green-400" />
												<span className="text-green-600">成功</span>
											</>
										) : (
											<>
												<CloseCircleOutlined className="text-red-400" />
												<span className="text-red-600">失败</span>
											</>
										)}
									</div>
								</div>
							</div>
						)}
					</ModalBody>
				</ModalContent>
			</Modal>
		</div>
	);
}