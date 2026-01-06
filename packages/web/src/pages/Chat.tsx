import { useChat } from '@ai-sdk/react';
import {
	AppstoreAddOutlined,
	CloudUploadOutlined,
	CommentOutlined,
	DeleteOutlined,
	EditOutlined,
	EllipsisOutlined,
	FileSearchOutlined,
	GlobalOutlined,
	HeartOutlined,
	PaperClipOutlined,
	ProductOutlined,
	QuestionCircleOutlined,
	ScheduleOutlined,
	ShareAltOutlined,
	SmileOutlined,
	SyncOutlined,
} from '@ant-design/icons';
import {
	Actions,
	Attachments,
	Bubble,
	Conversations,
	Prompts,
	Sender,
	ThoughtChain,
	Welcome,
	XProvider,
} from '@ant-design/x';
import Think from '@ant-design/x/es/think';
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';
import { Avatar, Button, Flex, message, Pagination, Space } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import '@ant-design/x-markdown/themes/light.css';
import '@ant-design/x-markdown/themes/dark.css';
import { ReactInfographic } from '../components/InfographicRenderer';
import { useMarkdownTheme } from '../utils/x-markdown';

interface ThinkComponentProps {
	streamStatus?: string;
	children?: React.ReactNode;
}

interface FooterProps {
	id?: string | number;
	content?: string;
	extraInfo?: {
		feedback?: 'default' | 'like' | 'dislike';
	};
	status?: string;
}

interface MessagePart {
	type: string;
	text?: string;
}

const InfographicCode: React.FC<ComponentProps> = (props) => {
	const { className, children } = props;
	const lang = className?.match(/language-(\w+)/)?.[1] || '';

	if (typeof children !== 'string') return null;
	if (lang === 'infographic') {
		// console.log('Rendering infographic, content length:', children.length);
		// console.log('Infographic content:', children);
		return <ReactInfographic>{children}</ReactInfographic>;
	}
	return <code className={className}>{children}</code>;
};

const HOT_TOPICS = {
	key: '1',
	label: '热门话题',
	children: [
		{
			key: '1-1',
			description: '什么是 Hello Code？',
			icon: <span style={{ color: '#f93a4a', fontWeight: 700 }}>1</span>,
		},
		{
			key: '1-2',
			description: '新的 AGI 混合界面',
			icon: <span style={{ color: '#ff6565', fontWeight: 700 }}>2</span>,
		},
		{
			key: '1-3',
			description: '新的设计范式',
			icon: <span style={{ color: '#ff8f1f', fontWeight: 700 }}>3</span>,
		}
	],
};

const DESIGN_GUIDE = {
	key: '2',
	label: '设计指南',
	children: [
		{
			key: '2-1',
			icon: <HeartOutlined />,
			label: '意图',
			description: 'AI 理解用户需求并提供解决方案',
		},
		{
			key: '2-2',
			icon: <SmileOutlined />,
			label: '角色',
			description: 'AI 公共人物和图像',
		},
		{
			key: '2-3',
			icon: <CommentOutlined />,
			label: '聊天',
			description: 'AI 如何表达自己，用户才能理解',
		},
		{
			key: '2-4',
			icon: <PaperClipOutlined />,
			label: '界面',
			description: 'AI 平衡',
		},
	],
};

const _SENDER_PROMPTS = [
	{
		key: '1',
		description: '升级',
		icon: <ScheduleOutlined />,
	},
	{
		key: '2',
		description: '组件',
		icon: <ProductOutlined />,
	},
	{
		key: '3',
		description: '富指南',
		icon: <FileSearchOutlined />,
	},
	{
		key: '4',
		description: '安装介绍',
		icon: <AppstoreAddOutlined />,
	},
];

const THOUGHT_CHAIN_CONFIG = {
	loading: {
		title: '模型正在运行',
		status: 'loading',
	},
	updating: {
		title: '模型正在运行',
		status: 'loading',
	},
	success: {
		title: '大模型执行完成',
		status: 'success',
	},
	error: {
		title: '执行失败',
		status: 'error',
	},
	abort: {
		title: '已经终止',
		status: 'abort',
	},
};

const DEFAULT_CONVERSATIONS_ITEMS = [
	{
		key: 'default-0',
		label: '新的会话 1',
		group: '今天',
	},
];

const ChatContext = React.createContext<{
	onReload?: (id: string, action: { userAction: string }) => void;
	setMessage?: (
		id: string,
		updater: (msg: Record<string, unknown>) => Record<string, unknown>,
	) => void;
}>({});

const ThinkComponent = React.memo((props: ThinkComponentProps) => {
	const [title, setTitle] = React.useState('深度思考中...');
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		if (props.streamStatus === 'done') {
			setTitle('思考完成');
			setLoading(false);
		}
	}, [props.streamStatus]);

	return (
		<Think title={title} loading={loading}>
			{props.children}
		</Think>
	);
});

const Footer = ({ id, content, extraInfo, status }: FooterProps) => {
	const context = React.useContext(ChatContext);
	const Items = [
		{
			key: 'pagination',
			actionRender: <Pagination simple total={1} pageSize={1} />,
		},
		{
			key: 'retry',
			label: '重试',
			icon: <SyncOutlined />,
			onItemClick: () => {
				if (id) {
					context?.onReload?.(String(id), {
						userAction: 'retry',
					});
				}
			},
		},
		{
			key: 'copy',
			actionRender: <Actions.Copy text={content || ''} />,
		},
		{
			key: 'audio',
			actionRender: (
				<Actions.Audio
					onClick={() => {
						message.info('这是模拟数据');
					}}
				/>
			),
		},
		{
			key: 'feedback',
			actionRender: (
				<Actions.Feedback
					styles={{
						liked: {
							color: '#f759ab',
						},
					}}
					value={extraInfo?.feedback || 'default'}
					key="feedback"
					onChange={(val) => {
						if (id) {
							context?.setMessage?.(String(id), () => ({
								extraInfo: {
									feedback: val,
								},
							}));
							message.success(`${id}: ${val}`);
						} else {
							message.error('has no id!');
						}
					}}
				/>
			),
		},
	];
	return status !== 'updating' && status !== 'loading' ? (
		<div style={{ display: 'flex' }}>{id && <Actions items={Items} />}</div>
	) : null;
};

const getRole = (className: string) => ({
	assistant: {
		placement: 'start' as const,
		styles: {
			content: {
				backgroundColor: '#f5f5f5',
				maxWidth: 800,
			},
		},
		header: (_: unknown, { status }: { status?: string }) => {
			if (!status) return null;
			const config = THOUGHT_CHAIN_CONFIG[status];
			return config ? (
				<ThoughtChain.Item
					style={{
						marginBottom: 8,
					}}
					status={config.status}
					variant="solid"
					icon={<GlobalOutlined />}
					title={config.title}
				/>
			) : null;
		},
		footer: (content: string, info: Record<string, unknown>) => (
			<Footer
				content={content}
				status={info.status as string | undefined}
				extraInfo={info.extraInfo as FooterProps['extraInfo']}
				id={info.key as string | number | undefined}
			/>
		),
		contentRender: (
			content: string,
			{ streaming }: { streaming?: boolean },
		) => {
			// console.log('Rendering content:', content);
			return (
				<XMarkdown
					paragraphTag="div"
					components={{
						think: ThinkComponent,
						code: InfographicCode,
					}}
					className={className}
					streaming={{
						hasNextChunk: !!streaming,
						enableAnimation: true,
					}}
				>
					{content}
				</XMarkdown>
			);
		},
	},
	user: {
		placement: 'end' as const,
		styles: {
			content: {
				backgroundColor: '#1677ff',
				color: 'white',
			},
		},
	},
});

const Independent = () => {
	const [state, setState] = React.useState({
		conversations: DEFAULT_CONVERSATIONS_ITEMS,
		activeConversationKey: DEFAULT_CONVERSATIONS_ITEMS[0].key,
	});

	const { conversations, activeConversationKey } = state;

	const setActiveConversationKey = (key) => {
		setState((prev) => ({ ...prev, activeConversationKey: key }));
	};

	const setConversations = (newConversations) => {
		setState((prev) => ({ ...prev, conversations: newConversations }));
	};

	const _addConversation = (newConversation) => {
		setState((prev) => ({
			...prev,
			conversations: [...prev.conversations, newConversation],
		}));
	};

	const [className] = useMarkdownTheme();
	const [_messageApi, contextHolder] = message.useMessage();
	const [attachmentsOpen, setAttachmentsOpen] = useState(false);
	const [attachedFiles, setAttachedFiles] = useState([]);

	const [inputValue, setInputValue] = useState('');

	const listRef = useRef(null);

	const { messages, sendMessage, status, stop } = useChat();

	const isLoading = status === 'streaming' || status === 'submitted';

	const onSubmit = (val: string) => {
		if (!val) return;
		sendMessage({ text: val });
		listRef.current?.scrollTo({ top: 'bottom' });
	};

	const chatSide = (
		<div className="bg-gray-100/80 w-[280px] h-full flex flex-col p-0 px-3 box-border">
			<div className="flex items-center justify-start px-6 box-border gap-2 my-6">
				<img
					src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
					draggable={false}
					alt="logo"
					width={24}
					height={24}
				/>
				<span className="font-bold text-gray-800 text-base">Hello Code</span>
			</div>
			<Conversations
				creation={{
					onClick: () => {
						const now = dayjs().valueOf().toString();
						const newConversation = {
							key: now,
							label: `新的会话 ${conversations.length + 1}`,
							group: '今天',
						};
						setConversations((prev) => ({
							...prev,
							conversations: [...prev.conversations, newConversation],
						}));
						setActiveConversationKey(now);
					},
				}}
				items={conversations.map(({ key, label, ...other }) => ({
					key,
					label: key === activeConversationKey ? `[当前会话]${label}` : label,
					...other,
				}))}
				className="overflow-y-auto mt-3 p-0 flex-1"
				activeKey={activeConversationKey}
				onActiveChange={setActiveConversationKey}
				groupable
				styles={{ item: { padding: '0 8px' } }}
				menu={(conversation) => ({
					items: [
						{
							label: '重命名',
							key: 'rename',
							icon: <EditOutlined />,
						},
						{
							label: '删除',
							key: 'delete',
							icon: <DeleteOutlined />,
							danger: true,
							onClick: () => {
								const newList = conversations.filter(
									(item) => item.key !== conversation.key,
								);
								const newKey = newList?.[0]?.key;
								setConversations((prev) => ({
									...prev,
									conversations: newList,
								}));
								if (conversation.key === activeConversationKey) {
									setActiveConversationKey(newKey);
								}
							},
						},
					],
				})}
			/>

			<div className="border-t border-gray-300 h-10 flex items-center justify-between">
				<Avatar size={24} />
				<Button type="text" icon={<QuestionCircleOutlined />} />
			</div>
		</div>
	);

	const chatList = (
		<div
			className="flex flex-1 min-h-0 flex-col overflow-auto"
			style={{ width: '100%' }}
		>
			{messages?.length ? (
				<Bubble.List
					ref={listRef}
					items={messages?.map((msg, idx) => {
const content =
							msg.parts
								?.filter((part: MessagePart) => part.type === 'text')
								.map((part: MessagePart) => part.text)
								.join('') || '';
						const isLastAssistant =
							idx === messages.length - 1 && msg.role === 'assistant';
						const isStreaming = status === 'streaming' && isLastAssistant;
						return {
							...msg,
							content,
							key: msg.id || idx,
							streaming: isStreaming,
							loading: status === 'submitted' && isLastAssistant,
						};
					})}
					role={getRole(className)}
				/>
			) : (
				<Flex
					vertical
					style={{
						maxWidth: 1152,
					}}
					gap={16}
					className="pt-8 w-full px-6 box-border"
				>
					<Welcome
						style={{
							width: '100%',
						}}
						variant="borderless"
						icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
						title="欢迎使用"
						description="欢迎使用 Hello Code"
						extra={
							<Space>
								<Button icon={<ShareAltOutlined />} />
								<Button icon={<EllipsisOutlined />} />
							</Space>
						}
					/>
					<Flex
						gap={16}
						justify="center"
						style={{
							width: '100%',
						}}
					>
						<Prompts
							items={[HOT_TOPICS]}
							styles={{
								list: { height: '100%' },
								item: {
									flex: 1,
									backgroundImage:
										'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
									borderRadius: 12,
									border: 'none',
								},
								subItem: { padding: 0, background: 'transparent' },
							}}
							onItemClick={(info) => {
								onSubmit(String(info.data.description));
							}}
							className="w-full max-w-[1152px]"
						/>

						<Prompts
							items={[DESIGN_GUIDE]}
							styles={{
								item: {
									flex: 1,
									backgroundImage:
										'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
									borderRadius: 12,
									border: 'none',
								},
								subItem: { background: '#ffffffa6' },
							}}
							onItemClick={(info) => {
								onSubmit(String(info.data.description));
							}}
							className="w-full max-w-[1152px]"
						/>
					</Flex>
				</Flex>
			)}
		</div>
	);

	const senderHeader = (
		<Sender.Header
			title="上传文件"
			open={attachmentsOpen}
			onOpenChange={setAttachmentsOpen}
			styles={{ content: { padding: 0 } }}
		>
			<Attachments
				beforeUpload={() => false}
				items={attachedFiles}
				onChange={(info) => setAttachedFiles(info.fileList)}
				placeholder={(type) =>
					type === 'drop'
						? { title: '拖拽文件到这里' }
						: {
								icon: <CloudUploadOutlined />,
								title: '上传文件',
								description: '点击或拖拽文件到这里上传',
							}
				}
			/>
		</Sender.Header>
	);

	const chatSender = (
		<Flex vertical gap={12} align="center" className="w-full">
			<Sender
				value={inputValue}
				header={senderHeader}
				onSubmit={() => {
					onSubmit(inputValue);
					setInputValue('');
				}}
				onChange={setInputValue}
				onCancel={() => {
					stop();
				}}
				prefix={
					<Button
						type="text"
						icon={<PaperClipOutlined style={{ fontSize: 18 }} />}
						onClick={() => setAttachmentsOpen(!attachmentsOpen)}
					/>
				}
				loading={isLoading}
				className="w-full max-w-[1152px]"
				allowSpeech
				placeholder="请输入问题或使用技能"
			/>
		</Flex>
	);

	return (
		<XProvider>
			<ChatContext.Provider value={{}}>
				{contextHolder}
				<div className="w-full h-full flex bg-white font-sans">
					{chatSide}
					<div className="h-full flex-1 flex items-center justify-center overflow-hidden px-6">
						<div className="h-full w-full max-w-6xl flex flex-col overflow-hidden">
							{chatList}
							{chatSender}
						</div>
					</div>
				</div>
			</ChatContext.Provider>
		</XProvider>
	);
};

export default Independent;
