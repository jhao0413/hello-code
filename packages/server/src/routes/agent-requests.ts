import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma.js';

type AgentRequestBody = {
	sessionId: string;
	userPrompt: string;
	aiResponse: string;
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	success: boolean;
	duration: number;
	turnsCount: number;
	toolCallsCount: number;
	model: string;
	languages?: string[];
	timestamp: string | number;
	userId: string;
};

export const agentRequestRoutes = new Elysia({ prefix: '/api/agent-requests' })
	// Get request statistics for dashboard
	.get('/stats', async () => {
		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const lastWeekStart = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);

		// Total requests count
		const totalRequests = await prisma.agentRequest.count();

		// Today's requests
		const todayRequests = await prisma.agentRequest.count({
			where: { timestamp: { gte: todayStart } },
		});

		// Yesterday's requests (for comparison)
		const yesterdayRequests = await prisma.agentRequest.count({
			where: {
				timestamp: { gte: yesterdayStart, lt: todayStart },
			},
		});

		// This week's requests
		const thisWeekRequests = await prisma.agentRequest.count({
			where: { timestamp: { gte: weekAgo } },
		});

		// Last week's requests (for comparison)
		const lastWeekRequests = await prisma.agentRequest.count({
			where: {
				timestamp: { gte: lastWeekStart, lt: weekAgo },
			},
		});

		// This week's unique sessions (distinct sessionId count)
		const thisWeekSessions = await prisma.agentRequest.groupBy({
			by: ['sessionId'],
			where: { timestamp: { gte: weekAgo } },
		});
		const thisWeekUniqueSessions = thisWeekSessions.length;

		// Last week's unique sessions
		const lastWeekSessions = await prisma.agentRequest.groupBy({
			by: ['sessionId'],
			where: { timestamp: { gte: lastWeekStart, lt: weekAgo } },
		});
		const lastWeekUniqueSessions = lastWeekSessions.length;

		// Total tokens
		const tokenStats = await prisma.agentRequest.aggregate({
			_sum: {
				promptTokens: true,
				completionTokens: true,
				totalTokens: true,
			},
		});

		// Success rate
		const successCount = await prisma.agentRequest.count({
			where: { success: true },
		});

		// Model usage stats
		const modelUsage = await prisma.agentRequest.groupBy({
			by: ['model'],
			_count: { model: true },
			_sum: { totalTokens: true },
			orderBy: { _count: { model: 'desc' } },
		});

		// Daily requests for last 7 days
		const dailyRequests = await prisma.$queryRaw<
			{ date: Date; count: bigint }[]
		>`
      SELECT DATE(timestamp) as date, COUNT(*) as count
      FROM "agentRequest"
      WHERE timestamp >= ${weekAgo}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

		// Recent requests for activity log
		const recentRequests = await prisma.agentRequest.findMany({
			take: 10,
			orderBy: { timestamp: 'desc' },
			select: {
				id: true,
				sessionId: true,
				userPrompt: true,
				success: true,
				model: true,
				totalTokens: true,
				duration: true,
				timestamp: true,
			},
		});

		// User usage ranking
		const userRanking = await prisma.agentRequest.groupBy({
			by: ['userId'],
			_count: { id: true },
			_sum: { totalTokens: true },
			orderBy: { _count: { id: 'desc' } },
			take: 10,
		});

		// Language usage stats
		const requestsWithLanguages = await prisma.agentRequest.findMany({
			select: { languages: true },
			where: { languages: { isEmpty: false } },
		});

		const languageCounts = new Map<string, number>();
		for (const req of requestsWithLanguages) {
			for (const lang of req.languages) {
				languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
			}
		}

		const languageUsage = Array.from(languageCounts.entries())
			.map(([language, count]) => ({ language, count }))
			.sort((a, b) => b.count - a.count);

		// Get user details for ranking
		const userIds = userRanking.map((u: { userId: string }) => u.userId);
		const users = await prisma.user.findMany({
			where: { id: { in: userIds } },
			select: { id: true, name: true, email: true },
		});

		const userMap = new Map(
			users.map((u: { id: string; name: string | null; email: string }) => [
				u.id,
				u,
			]),
		);
		const userRankingWithDetails = userRanking.map(
			(u: {
				userId: string;
				_count: { id: number };
				_sum: { totalTokens: number | null };
			}) => {
				const user = userMap.get(u.userId);
				return {
					userId: u.userId,
					name: user?.name || user?.email || 'Unknown',
					email: user?.email || '',
					requestCount: u._count.id,
					totalTokens: u._sum.totalTokens || 0,
				};
			},
		);

		return {
			totalRequests,
			todayRequests,
			yesterdayRequests,
			thisWeekRequests,
			lastWeekRequests,
			thisWeekUniqueSessions,
			lastWeekUniqueSessions,
			totalTokens: tokenStats._sum.totalTokens || 0,
			promptTokens: tokenStats._sum.promptTokens || 0,
			completionTokens: tokenStats._sum.completionTokens || 0,
			successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
			modelUsage: modelUsage.map(
				(m: {
					model: string;
					_count: { model: number };
					_sum: { totalTokens: number | null };
				}) => ({
					model: m.model,
					count: m._count.model,
					tokens: m._sum.totalTokens || 0,
				}),
			),
			dailyRequests: dailyRequests.map((d) => ({
				date: d.date,
				count: Number(d.count),
			})),
			recentRequests,
			userRanking: userRankingWithDetails,
			languageUsage,
		};
	})
	// Get all requests for a specific session
	.get(
		'/by-session/:sessionId',
		async ({ params }) => {
			const requests = await prisma.agentRequest.findMany({
				where: { sessionId: params.sessionId },
				orderBy: { timestamp: 'asc' },
				select: {
					id: true,
					sessionId: true,
					userPrompt: true,
					aiResponse: true,
					success: true,
					model: true,
					totalTokens: true,
					duration: true,
					turnsCount: true,
					toolCallsCount: true,
					timestamp: true,
				},
			});
			return requests;
		},
		{
			params: t.Object({
				sessionId: t.String(),
			}),
		},
	)
	// Get all agent requests
	.get(
		'/',
		async ({ query }) => {
			const { userId } = query;
			const requests = await prisma.agentRequest.findMany({
				where: {
					...(userId && { userId }),
				},
				include: {
					user: { select: { id: true, name: true, email: true } },
				},
				orderBy: { timestamp: 'desc' },
			});
			return requests;
		},
		{
			query: t.Object({
				userId: t.Optional(t.String()),
			}),
		},
	)
	// Get single agent request
	.get(
		'/:id',
		async ({ params, set }) => {
			const request = await prisma.agentRequest.findUnique({
				where: { id: params.id },
				include: {
					user: { select: { id: true, name: true, email: true } },
				},
			});
			if (!request) {
				set.status = 404;
				return { message: 'Agent request not found' };
			}
			return request;
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	// Create agent request
	.post(
		'/',
		async ({ body }) => {
			const typedBody = body as AgentRequestBody;
			const data = {
				sessionId: typedBody.sessionId,
				userPrompt: typedBody.userPrompt,
				aiResponse: typedBody.aiResponse,
				promptTokens: typedBody.promptTokens,
				completionTokens: typedBody.completionTokens,
				totalTokens: typedBody.totalTokens,
				success: typedBody.success,
				duration: typedBody.duration,
				turnsCount: typedBody.turnsCount,
				toolCallsCount: typedBody.toolCallsCount,
				model: typedBody.model,
				languages: typedBody.languages ?? [],
				timestamp: new Date(typedBody.timestamp),
				userId: typedBody.userId,
			};
			const request = await prisma.agentRequest.create({
				data,
			});
			console.log('Agent request created:', request.id);
			return request;
		},
		{
			body: t.Object({
				sessionId: t.String(),
				userPrompt: t.String(),
				aiResponse: t.String(),
				promptTokens: t.Number(),
				completionTokens: t.Number(),
				totalTokens: t.Number(),
				success: t.Boolean(),
				duration: t.Number(),
				turnsCount: t.Number(),
				toolCallsCount: t.Number(),
				model: t.String(),
				languages: t.Optional(t.Array(t.String())),
				timestamp: t.Union([t.String(), t.Number()]),
				userId: t.String(),
			}),
		},
	)
	// Delete agent request
	.delete(
		'/:id',
		async ({ params }) => {
			await prisma.agentRequest.delete({
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
