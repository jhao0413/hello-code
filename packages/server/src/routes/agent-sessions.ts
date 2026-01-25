import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma.js';

type AgentSessionBody = {
	sessionId: string;
	userPrompt: string;
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

export const agentSessionRoutes = new Elysia({ prefix: '/api/agent-sessions' })
	// Get dashboard statistics
	.get('/stats', async () => {
		const now = new Date();
		const todayStart = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
		);
		const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const lastWeekStart = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		// Total sessions count
		const totalSessions = await prisma.agentSession.count();

		// Today's sessions
		const todaySessions = await prisma.agentSession.count({
			where: { timestamp: { gte: todayStart } },
		});

		// Yesterday's sessions (for comparison)
		const yesterdaySessions = await prisma.agentSession.count({
			where: {
				timestamp: { gte: yesterdayStart, lt: todayStart },
			},
		});

		// This week's sessions
		const thisWeekSessions = await prisma.agentSession.count({
			where: { timestamp: { gte: weekAgo } },
		});

		// Last week's sessions (for comparison)
		const lastWeekSessions = await prisma.agentSession.count({
			where: {
				timestamp: { gte: lastWeekStart, lt: weekAgo },
			},
		});

		// This month's sessions
		const monthSessions = await prisma.agentSession.count({
			where: { timestamp: { gte: monthStart } },
		});

		// Total tokens
		const tokenStats = await prisma.agentSession.aggregate({
			_sum: {
				promptTokens: true,
				completionTokens: true,
				totalTokens: true,
			},
		});

		// Success rate
		const successCount = await prisma.agentSession.count({
			where: { success: true },
		});

		// Model usage stats
		const modelUsage = await prisma.agentSession.groupBy({
			by: ['model'],
			_count: { model: true },
			_sum: { totalTokens: true },
			orderBy: { _count: { model: 'desc' } },
		});

		// Daily sessions for last 7 days
		const dailySessions = await prisma.$queryRaw<
			{ date: Date; count: bigint }[]
		>`
      SELECT DATE(timestamp) as date, COUNT(*) as count
      FROM "agentSession"
      WHERE timestamp >= ${weekAgo}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

		// Recent sessions for activity log
		const recentSessions = await prisma.agentSession.findMany({
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
		const userRanking = await prisma.agentSession.groupBy({
			by: ['userId'],
			_count: { id: true },
			_sum: { totalTokens: true },
			orderBy: { _count: { id: 'desc' } },
			take: 10,
		});

		// Language usage stats (get all languages from sessions)
		const sessionsWithLanguages = await prisma.agentSession.findMany({
			select: { languages: true },
			where: { languages: { isEmpty: false } },
		});

		// Count language occurrences
		const languageCounts = new Map<string, number>();
		for (const session of sessionsWithLanguages) {
			for (const lang of session.languages) {
				languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
			}
		}

		// Convert to sorted array
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
					sessionCount: u._count.id,
					totalTokens: u._sum.totalTokens || 0,
				};
			},
		);

		return {
			totalSessions,
			todaySessions,
			yesterdaySessions,
			thisWeekSessions,
			lastWeekSessions,
			monthSessions,
			totalTokens: tokenStats._sum.totalTokens || 0,
			promptTokens: tokenStats._sum.promptTokens || 0,
			completionTokens: tokenStats._sum.completionTokens || 0,
			successRate: totalSessions > 0 ? (successCount / totalSessions) * 100 : 0,
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
			dailySessions: dailySessions.map((d) => ({
				date: d.date,
				count: Number(d.count),
			})),
			recentSessions,
			userRanking: userRankingWithDetails,
			languageUsage,
		};
	})
	// Get all agent sessions
	.get(
		'/',
		async ({ query }) => {
			const { userId } = query;
			const sessions = await prisma.agentSession.findMany({
				where: {
					...(userId && { userId }),
				},
				include: {
					user: { select: { id: true, name: true, email: true } },
				},
				orderBy: { timestamp: 'desc' },
			});
			return sessions;
		},
		{
			query: t.Object({
				userId: t.Optional(t.String()),
			}),
		},
	)
	// Get single agent session
	.get(
		'/:id',
		async ({ params, set }) => {
			const session = await prisma.agentSession.findUnique({
				where: { id: params.id },
				include: {
					user: { select: { id: true, name: true, email: true } },
				},
			});
			if (!session) {
				set.status = 404;
				return { message: 'Agent session not found' };
			}
			return session;
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	// Create or update agent session
	.post(
		'/',
		async ({ body }) => {
			const typedBody = body as AgentSessionBody;
			const data = {
				userPrompt: typedBody.userPrompt,
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
			const session = await prisma.agentSession.upsert({
				where: { sessionId: typedBody.sessionId },
				create: { sessionId: typedBody.sessionId, ...data },
				update: data,
			});
			console.log(session);
			console.log('插入成功');
			return session;
		},
		{
			body: t.Object({
				sessionId: t.String(),
				userPrompt: t.String(),
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
	// Update agent session
	.patch(
		'/:id',
		async ({ params, body }) => {
			const typedBody = body as Partial<AgentSessionBody>;
			const data: Record<string, unknown> = { ...typedBody };
			if (typedBody.timestamp) {
				data.timestamp = new Date(typedBody.timestamp);
			}
			const session = await prisma.agentSession.update({
				where: { id: params.id },
				data,
			});
			return session;
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				sessionId: t.Optional(t.String()),
				userPrompt: t.Optional(t.String()),
				promptTokens: t.Optional(t.Number()),
				completionTokens: t.Optional(t.Number()),
				totalTokens: t.Optional(t.Number()),
				success: t.Optional(t.Boolean()),
				duration: t.Optional(t.Number()),
				turnsCount: t.Optional(t.Number()),
				toolCallsCount: t.Optional(t.Number()),
				model: t.Optional(t.String()),
				languages: t.Optional(t.Array(t.String())),
				timestamp: t.Optional(t.Union([t.String(), t.Number()])),
			}),
		},
	)
	// Delete agent session
	.delete(
		'/:id',
		async ({ params }) => {
			await prisma.agentSession.delete({
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
