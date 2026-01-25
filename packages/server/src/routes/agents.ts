import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma.js';

export const agentRoutes = new Elysia({ prefix: '/api/agents' })
	// Get all agents
	.get(
		'/',
		async ({ query }) => {
			const { userId } = query;
			const agents = await prisma.agent.findMany({
				where: userId ? { userId } : undefined,
				orderBy: { createdAt: 'desc' },
			});
			return agents;
		},
		{
			query: t.Object({
				userId: t.Optional(t.String()),
			}),
		},
	)
	// Get single agent
	.get(
		'/:id',
		async ({ params, set }) => {
			const agent = await prisma.agent.findUnique({
				where: { id: params.id },
			});
			if (!agent) {
				set.status = 404;
				return { message: 'Agent not found' };
			}
			return agent;
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	// Create agent
	.post(
		'/',
		async ({ body }) => {
			const agent = await prisma.agent.create({
				data: body as {
					name: string;
					description?: string;
					model?: string;
					systemPrompt?: string;
					userId: string;
				},
			});
			return agent;
		},
		{
			body: t.Object({
				name: t.String(),
				description: t.Optional(t.String()),
				model: t.Optional(t.String()),
				systemPrompt: t.Optional(t.String()),
				userId: t.String(),
			}),
		},
	)
	// Update agent
	.patch(
		'/:id',
		async ({ params, body }) => {
			const agent = await prisma.agent.update({
				where: { id: params.id },
				data: body,
			});
			return agent;
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				name: t.Optional(t.String()),
				description: t.Optional(t.String()),
				model: t.Optional(t.String()),
				systemPrompt: t.Optional(t.String()),
				status: t.Optional(t.String()),
			}),
		},
	)
	// Delete agent
	.delete(
		'/:id',
		async ({ params }) => {
			await prisma.agent.delete({
				where: { id: params.id },
			});
			return { success: true };
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	);
