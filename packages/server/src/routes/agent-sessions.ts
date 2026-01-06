import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma.js';

type AgentSessionBody = {
	session_id: string;
	user_prompt: string;
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
	success: boolean;
	duration: number;
	turns_count: number;
	tool_calls_count: number;
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
				prompt_tokens: true,
				completion_tokens: true,
				total_tokens: true,
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
			_sum: { total_tokens: true },
			orderBy: { _count: { model: 'desc' } },
		});

		// Daily sessions for last 7 days
		const dailySessions = await prisma.$queryRaw<
			{ date: Date; count: bigint }[]
		>`
      SELECT DATE(timestamp) as date, COUNT(*) as count
      FROM "agent_sessions"
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
				session_id: true,
				user_prompt: true,
				success: true,
				model: true,
				total_tokens: true,
				duration: true,
				timestamp: true,
			},
		});

		// User usage ranking
		const userRanking = await prisma.agentSession.groupBy({
			by: ['userId'],
			_count: { id: true },
			_sum: { total_tokens: true },
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
				_sum: { total_tokens: number | null };
			}) => {
				const user = userMap.get(u.userId);
				return {
					userId: u.userId,
					name: user?.name || user?.email || 'Unknown',
					email: user?.email || '',
					sessionCount: u._count.id,
					totalTokens: u._sum.total_tokens || 0,
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
			totalTokens: tokenStats._sum.total_tokens || 0,
			promptTokens: tokenStats._sum.prompt_tokens || 0,
			completionTokens: tokenStats._sum.completion_tokens || 0,
			successRate: totalSessions > 0 ? (successCount / totalSessions) * 100 : 0,
			modelUsage: modelUsage.map(
				(m: {
					model: string;
					_count: { model: number };
					_sum: { total_tokens: number | null };
				}) => ({
					model: m.model,
					count: m._count.model,
					tokens: m._sum.total_tokens || 0,
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
				user_prompt: typedBody.user_prompt,
				prompt_tokens: typedBody.prompt_tokens,
				completion_tokens: typedBody.completion_tokens,
				total_tokens: typedBody.total_tokens,
				success: typedBody.success,
				duration: typedBody.duration,
				turns_count: typedBody.turns_count,
				tool_calls_count: typedBody.tool_calls_count,
				model: typedBody.model,
				languages: typedBody.languages ?? [],
				timestamp: new Date(typedBody.timestamp),
				userId: typedBody.userId,
			};
			const session = await prisma.agentSession.upsert({
				where: { session_id: typedBody.session_id },
				create: { session_id: typedBody.session_id, ...data },
				update: data,
			});
			console.log(session);
			console.log('插入成功');
			return session;
		},
		{
			body: t.Object({
				session_id: t.String(),
				user_prompt: t.String(),
				prompt_tokens: t.Number(),
				completion_tokens: t.Number(),
				total_tokens: t.Number(),
				success: t.Boolean(),
				duration: t.Number(),
				turns_count: t.Number(),
				tool_calls_count: t.Number(),
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
				session_id: t.Optional(t.String()),
				user_prompt: t.Optional(t.String()),
				prompt_tokens: t.Optional(t.Number()),
				completion_tokens: t.Optional(t.Number()),
				total_tokens: t.Optional(t.Number()),
				success: t.Optional(t.Boolean()),
				duration: t.Optional(t.Number()),
				turns_count: t.Optional(t.Number()),
				tool_calls_count: t.Optional(t.Number()),
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
