import { PlayCircleOutlined, SettingOutlined } from '@ant-design/icons';
import {
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Chip,
} from '@heroui/react';
import { Col, Row, Tag } from 'antd';

const mockAgents = [
	{
		id: '1',
		name: '代码审查',
		description: '自动审查代码并提供改进建议',
		status: 'active',
		model: 'claude-3-opus',
	},
	{
		id: '2',
		name: 'Bug 修复',
		description: '识别并修复代码库中的缺陷',
		status: 'active',
		model: 'claude-3-sonnet',
	},
	{
		id: '3',
		name: '文档编写',
		description: '为您的代码生成技术文档',
		status: 'idle',
		model: 'claude-3-haiku',
	},
	{
		id: '4',
		name: '测试生成',
		description: '为您的函数创建单元测试',
		status: 'idle',
		model: 'gpt-4',
	},
];

export default function Agents() {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">智能体</h1>
				<Button color="primary">创建智能体</Button>
			</div>

			<Row gutter={[16, 16]}>
				{mockAgents.map((agent) => (
					<Col xs={24} sm={12} lg={6} key={agent.id}>
						<Card className="h-full">
							<CardHeader className="flex justify-between">
								<h3 className="text-lg font-semibold">{agent.name}</h3>
								<Chip
									color={agent.status === 'active' ? 'success' : 'default'}
									size="sm"
									variant="flat"
								>
									{agent.status}
								</Chip>
							</CardHeader>
							<CardBody>
								<p className="text-default-500 text-sm">{agent.description}</p>
								<Tag className="mt-2" color="blue">
									{agent.model}
								</Tag>
							</CardBody>
							<CardFooter className="gap-2">
								<Button
									size="sm"
									color="primary"
									variant="flat"
									startContent={<PlayCircleOutlined />}
								>
									运行
								</Button>
								<Button
									size="sm"
									variant="bordered"
									startContent={<SettingOutlined />}
								>
									配置
								</Button>
							</CardFooter>
						</Card>
					</Col>
				))}
			</Row>
		</div>
	);
}
