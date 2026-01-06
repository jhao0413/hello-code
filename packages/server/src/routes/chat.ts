import { deepseek } from '@ai-sdk/deepseek';
import { streamText } from 'ai';
import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma.js';

const INFOGRAPHIC_SKILL_PROMPT = `
你具备创建信息图表的能力。当用户需要可视化展示数据、流程、对比、时间线等信息时，请在回复中使用 markdown 代码块输出 infographic 语法。

## 输出格式

使用 \`\`\` infographic 代码块包裹语法：

\`\`\` infographic
infographic <template-name>
data
  title 标题
  desc 描述（可选）
  items
    - label 项目标签
      value 数值（可选）
      desc 项目描述（可选）
      icon 图标（可选）
\`\`\`

## 可用模板

- sequence-zigzag-steps-underline-text
- sequence-horizontal-zigzag-underline-text
- sequence-horizontal-zigzag-simple-illus
- sequence-circular-simple
- sequence-filter-mesh-simple
- sequence-mountain-underline-text
- sequence-cylinders-3d-simple
- sequence-color-snake-steps-horizontal-icon-line
- sequence-pyramid-simple
- sequence-roadmap-vertical-simple
- sequence-roadmap-vertical-plain-text
- sequence-zigzag-pucks-3d-simple
- sequence-ascending-steps
- sequence-ascending-stairs-3d-underline-text
- sequence-snake-steps-compact-card
- sequence-snake-steps-underline-text
- sequence-snake-steps-simple
- sequence-stairs-front-compact-card
- sequence-stairs-front-pill-badge
- sequence-timeline-simple
- sequence-timeline-rounded-rect-node
- sequence-timeline-simple-illus
- compare-binary-horizontal-simple-fold
- compare-hierarchy-left-right-circle-node-pill-badge
- compare-swot
- quadrant-quarter-simple-card
- quadrant-quarter-circular
- quadrant-simple-illus
- relation-circle-icon-badge
- relation-circle-circular-progress
- compare-binary-horizontal-badge-card-arrow
- compare-binary-horizontal-underline-text-vs
- hierarchy-tree-tech-style-capsule-item
- hierarchy-tree-curved-line-rounded-rect-node
- hierarchy-tree-tech-style-badge-card
- chart-column-simple
- chart-bar-plain-text
- chart-line-plain-text
- chart-pie-plain-text
- chart-pie-compact-card
- chart-pie-donut-plain-text
- chart-pie-donut-pill-badge
- chart-wordcloud
- list-grid-badge-card
- list-grid-candy-card-lite
- list-grid-ribbon-card
- list-row-horizontal-icon-arrow
- list-row-simple-illus
- list-sector-plain-text
- list-column-done-list
- list-column-vertical-icon-arrow
- list-column-simple-vertical-arrow

## 图标资源（可选）
使用 ref:search:关键词 格式自动搜索图标，如：ref:search:rocket

## 主题配置（可选）
themeConfig
  palette antv

## 注意事项
1. 保持用户输入的语言
2. 根据数据特点选择合适的模板
3. items 数量建议 3-7 个
4. 语法使用空格缩进（2个空格）
5. 键值对之间用空格分隔，不使用冒号
`;

interface UIMessage {
	id?: string;
	role: 'user' | 'assistant' | 'system';
	parts: Array<{ type: string; text?: string }>;
}

interface CoreMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

function convertToCoreMesages(messages: UIMessage[]): CoreMessage[] {
	return messages.map((msg) => ({
		role: msg.role,
		content: msg.parts
			.filter((part) => part.type === 'text' && part.text)
			.map((part) => part.text as string)
			.join(''),
	}));
}

export const chatRoutes = new Elysia({ prefix: '/api/chat' }).post(
	'/',
	async ({ body }) => {
		const { messages, conversationId, agentId } = body as {
			messages: UIMessage[];
			conversationId?: string;
			agentId?: string;
		};

		let systemPrompt = 'You are a helpful AI code assistant.';
		if (agentId) {
			const agent = await prisma.agent.findUnique({
				where: { id: agentId },
			});
			if (agent?.system_prompt) {
				systemPrompt = agent.system_prompt;
			}
		}

		const coreMessages = convertToCoreMesages(messages);
		if (conversationId) {
			const lastMessage = coreMessages[coreMessages.length - 1];
			if (lastMessage && lastMessage.role === 'user') {
				await prisma.message.create({
					data: {
						role: 'USER',
						content: lastMessage.content as string,
						conversationId,
					},
				});
			}
		}

		const fullSystemPrompt = `${systemPrompt}\n\n${INFOGRAPHIC_SKILL_PROMPT}`;

		const result = streamText({
			model: deepseek('deepseek-chat'),
			system: fullSystemPrompt,
			messages: coreMessages,
			async onFinish({ text }) {
				if (conversationId) {
					await prisma.message.create({
						data: {
							role: 'ASSISTANT',
							content: text,
							conversationId,
						},
					});
				}
			},
		});

		return result.toUIMessageStreamResponse();
	},
	{
		body: t.Object({
			messages: t.Array(
				t.Object({
					id: t.Optional(t.String()),
					role: t.String(),
					parts: t.Array(
						t.Object({
							type: t.String(),
							text: t.Optional(t.String()),
						}),
					),
				}),
			),
			conversationId: t.Optional(t.String()),
			agentId: t.Optional(t.String()),
		}),
	},
);
