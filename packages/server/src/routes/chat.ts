import { Elysia, t } from 'elysia';
import type { CoreMessage } from 'ai';
import prisma from '../lib/prisma.js';
import { weatherTool, infographicTool } from '../tools/index.js';
import {
	databaseIntrospectionTool,
	sqlGenerationTool,
	sqlExecutionTool,
} from '../tools/database-tools.js';
import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { PinoLogger } from '@mastra/loggers';

interface UIMessage {
	id?: string;
	role: 'user' | 'assistant' | 'system';
	parts: Array<{ type: string; text?: string }>;
}

function convertToCoreMessages(messages: UIMessage[]): CoreMessage[] {
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
		const { messages, conversationId, agentId, connectionString, enableDatabase = true } = body as {
			messages: UIMessage[];
			conversationId?: string;
			agentId?: string;
			connectionString?: string;
			enableDatabase?: boolean;
		};

		let systemPrompt = 'You are a helpful AI code assistant.';
		if (agentId) {
			const agent = await prisma.agent.findUnique({
				where: { id: agentId },
			});
			if (agent?.systemPrompt) {
				systemPrompt = agent.systemPrompt;
			}
		}

		const coreMessages = convertToCoreMessages(messages);
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

		// 构建工具集合
		const tools: any = {
			getWeather: weatherTool,
			createInfographicSyntax: infographicTool,
		};

		// 确定使用的数据库连接字符串
		// 优先级：1. 传入的 connectionString  2. 环境变量 DATABASE_URL
		let dbConnectionString: string | undefined;
		if (connectionString) {
			dbConnectionString = connectionString;
		} else if (enableDatabase && process.env.DATABASE_URL) {
			dbConnectionString = process.env.DATABASE_URL;
		}

		// 如果有数据库连接字符串，添加数据库查询工具
		if (dbConnectionString) {
			tools.databaseIntrospection = databaseIntrospectionTool;
			tools.sqlGeneration = sqlGenerationTool;
			tools.sqlExecution = sqlExecutionTool;
		}

		const BaseAgent = new Agent({
			name: 'Blinko Chat Agent',
			instructions: systemPrompt,
			model: 'deepseek/deepseek-chat',
			tools,
		});

		const agent = new Mastra({
			agents: { BaseAgent },
			logger:
				process.env.NODE_ENV === 'development'
					? new PinoLogger({
							name: 'Mastra',
							level: 'debug',
					  })
					: undefined,
		}).getAgent('BaseAgent');

		const originalDbUrl = process.env.DATABASE_URL;
		if (dbConnectionString) {
			process.env.DATABASE_URL = dbConnectionString;
		}

		try {
			const stream = await agent.stream(coreMessages, {
				format: 'aisdk',
			});

			return stream.toUIMessageStreamResponse();
		} finally {
			if (dbConnectionString) {
				if (originalDbUrl) {
					process.env.DATABASE_URL = originalDbUrl;
				} else {
					delete process.env.DATABASE_URL;
				}
			}
		}
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
			connectionString: t.Optional(t.String()),
			enableDatabase: t.Optional(t.Boolean()),
		}),
	},
);
