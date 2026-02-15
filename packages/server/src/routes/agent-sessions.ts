import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma.js';

type AgentSessionBody = {
	sessionId: string;
	userPrompt: string;
	aiResponse?: string;
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
	// Get dashboard statistics (optimized with raw SQL)
	.get('/stats', async () => {
		type SessionStatsRow = {
			total: bigint;
			today: bigint;
			yesterday: bigint;
			this_week: bigint;
			last_week: bigint;
			month: bigint;
			success: bigint;
			sum_prompt: bigint;
			sum_completion: bigint;
			sum_total: bigint;
		};

		type RequestStatsRow = {
			total: bigint;
			today: bigint;
			yesterday: bigint;
			this_week: bigint;
			last_week: bigint;
			success: bigint;
			sum_prompt: bigint;
			sum_completion: bigint;
			sum_total: bigint;
		};

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

		// ========== Session stats (single query with counts) ==========
		const [sessionStats] = await prisma.$queryRaw<SessionStatsRow[]>`
			SELECT
				COUNT(*) as total,
				COUNT(*) FILTER (WHERE timestamp >= ${todayStart}) as today,
				COUNT(*) FILTER (WHERE timestamp >= ${yesterdayStart} AND timestamp < ${todayStart}) as yesterday,
				COUNT(*) FILTER (WHERE timestamp >= ${weekAgo}) as this_week,
				COUNT(*) FILTER (WHERE timestamp >= ${lastWeekStart} AND timestamp < ${weekAgo}) as last_week,
				COUNT(*) FILTER (WHERE timestamp >= ${monthStart}) as month,
				COUNT(*) FILTER (WHERE success = true) as success,
				COALESCE(SUM("promptTokens"), 0) as sum_prompt,
				COALESCE(SUM("completionTokens"), 0) as sum_completion,
				COALESCE(SUM("totalTokens"), 0) as sum_total
			FROM "agentSession"
		`;

		// ========== Request stats (single query) ==========
		const [requestStats] = await prisma.$queryRaw<RequestStatsRow[]>`
			SELECT
				COUNT(*) as total,
				COUNT(*) FILTER (WHERE timestamp >= ${todayStart}) as today,
				COUNT(*) FILTER (WHERE timestamp >= ${yesterdayStart} AND timestamp < ${todayStart}) as yesterday,
				COUNT(*) FILTER (WHERE timestamp >= ${weekAgo}) as this_week,
				COUNT(*) FILTER (WHERE timestamp >= ${lastWeekStart} AND timestamp < ${weekAgo}) as last_week,
				COUNT(*) FILTER (WHERE success = true) as success,
				COALESCE(SUM("promptTokens"), 0) as sum_prompt,
				COALESCE(SUM("completionTokens"), 0) as sum_completion,
				COALESCE(SUM("totalTokens"), 0) as sum_total
			FROM "agentRequest"
		`;

		// ========== Unique sessions count ==========
		const [thisWeekUnique] = await prisma.$queryRaw<{ count: bigint }[]>`
			SELECT COUNT(DISTINCT "sessionId") as count FROM "agentRequest" WHERE timestamp >= ${weekAgo}
		`;
		const [lastWeekUnique] = await prisma.$queryRaw<{ count: bigint }[]>`
			SELECT COUNT(DISTINCT "sessionId") as count FROM "agentRequest" WHERE timestamp >= ${lastWeekStart} AND timestamp < ${weekAgo}
		`;

		// ========== Daily session/request counts for last 7 days ==========
		const dailySessions = await prisma.$queryRaw<
			{ date: Date; count: bigint }[]
		>`
			SELECT DATE(timestamp) as date, COUNT(*) as count
			FROM "agentSession"
			WHERE timestamp >= ${weekAgo}
			GROUP BY DATE(timestamp)
			ORDER BY date ASC
		`;
		const dailyRequests = await prisma.$queryRaw<
			{ date: Date; count: bigint }[]
		>`
			SELECT DATE(timestamp) as date, COUNT(*) as count
			FROM "agentRequest"
			WHERE timestamp >= ${weekAgo}
			GROUP BY DATE(timestamp)
			ORDER BY date ASC
		`;

		// ========== Model usage (combined) ==========
		const sessionModelUsage = await prisma.$queryRaw<{
			model: string;
			count: bigint;
			tokens: bigint;
		}[]>`
			SELECT model, COUNT(*) as count, COALESCE(SUM("totalTokens"), 0) as tokens
			FROM "agentSession"
			GROUP BY model
		`;
		const requestModelUsage = await prisma.$queryRaw<{
			model: string;
			count: bigint;
			tokens: bigint;
		}[]>`
			SELECT model, COUNT(*) as count, COALESCE(SUM("totalTokens"), 0) as tokens
			FROM "agentRequest"
			GROUP BY model
		`;

		// Merge model usage
		const modelUsageMap = new Map<string, { count: number; tokens: number }>();
		for (const m of sessionModelUsage) {
			modelUsageMap.set(m.model, { count: Number(m.count), tokens: Number(m.tokens) });
		}
		for (const m of requestModelUsage) {
			const existing = modelUsageMap.get(m.model);
			if (existing) {
				existing.count += Number(m.count);
				existing.tokens += Number(m.tokens);
			} else {
				modelUsageMap.set(m.model, { count: Number(m.count), tokens: Number(m.tokens) });
			}
		}
		const modelUsage = Array.from(modelUsageMap.entries())
			.map(([model, data]) => ({ model, ...data }))
			.sort((a, b) => b.count - a.count);

		// ========== Recent sessions ==========
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

		// ========== User ranking (combined, simplified) ==========
		const sessionUserRanking = await prisma.$queryRaw<{
			userId: string;
			count: bigint;
			tokens: bigint;
		}[]>`
			SELECT "userId", COUNT(*) as count, COALESCE(SUM("totalTokens"), 0) as tokens
			FROM "agentSession"
			GROUP BY "userId"
		`;
		const requestUserRanking = await prisma.$queryRaw<{
			userId: string;
			count: bigint;
			tokens: bigint;
		}[]>`
			SELECT "userId", COUNT(*) as count, COALESCE(SUM("totalTokens"), 0) as tokens
			FROM "agentRequest"
			GROUP BY "userId"
		`;

		// Merge user rankings
		const userStatsMap = new Map<
			string,
			{ sessionCount: number; requestCount: number; totalTokens: number }
		>();
		for (const u of sessionUserRanking) {
			userStatsMap.set(u.userId, {
				sessionCount: Number(u.count),
				requestCount: 0,
				totalTokens: Number(u.tokens),
			});
		}
		for (const u of requestUserRanking) {
			const existing = userStatsMap.get(u.userId);
			if (existing) {
				existing.requestCount += Number(u.count);
				existing.totalTokens += Number(u.tokens);
			} else {
				userStatsMap.set(u.userId, {
					sessionCount: 0,
					requestCount: Number(u.count),
					totalTokens: Number(u.tokens),
				});
			}
		}

		// Get user details
		const userIds = Array.from(userStatsMap.keys());
		const users = await prisma.user.findMany({
			where: { id: { in: userIds } },
			select: { id: true, name: true, email: true },
		});
		const userMap = new Map(
			users.map((u) => [u.id, u]),
		);

		const userRanking = Array.from(userStatsMap.entries())
			.map(([userId, stats]) => {
				const user = userMap.get(userId);
				return {
					userId,
					name: user?.name || user?.email || 'Unknown',
					email: user?.email || '',
					sessionCount: stats.sessionCount,
					requestCount: stats.requestCount,
					totalTokens: stats.totalTokens,
				};
			})
			.sort((a, b) => b.totalTokens - a.totalTokens)
			.slice(0, 10);

		// ========== Language usage (optimized with raw SQL) ==========
		const languageResult = await prisma.$queryRaw<{ language: string; count: bigint }[]>`
			SELECT language, COUNT(*) as count
			FROM (
				SELECT unnest(languages) as language FROM "agentSession" WHERE languages IS NOT NULL
				UNION ALL
				SELECT unnest(languages) as language FROM "agentRequest" WHERE languages IS NOT NULL
			) combined
			GROUP BY language
			ORDER BY count DESC;
		`;
		const languageUsage = languageResult.map(({ language, count }) => ({
			language,
			count: Number(count),
		}));

		// Calculate combined stats
		const totalSessionsVal = Number(sessionStats.total);
		const totalRequestsVal = Number(requestStats.total);
		const totalRecords = totalSessionsVal + totalRequestsVal;
		const totalTokensVal = Number(sessionStats.sum_total) + Number(requestStats.sum_total);
		const promptTokensVal = Number(sessionStats.sum_prompt) + Number(requestStats.sum_prompt);
		const completionTokensVal = Number(sessionStats.sum_completion) + Number(requestStats.sum_completion);
		const successRateVal = totalRecords > 0
			? (Number(sessionStats.success) + Number(requestStats.success)) / totalRecords * 100
			: 0;

		return {
			totalSessions: totalSessionsVal,
			todaySessions: Number(sessionStats.today),
			yesterdaySessions: Number(sessionStats.yesterday),
			thisWeekSessions: Number(sessionStats.this_week),
			lastWeekSessions: Number(sessionStats.last_week),
			monthSessions: Number(sessionStats.month),
			totalRequests: totalRequestsVal,
			todayRequests: Number(requestStats.today),
			yesterdayRequests: Number(requestStats.yesterday),
			thisWeekRequests: Number(requestStats.this_week),
			lastWeekRequests: Number(requestStats.last_week),
			thisWeekUniqueSessions: Number(thisWeekUnique?.count || 0),
			lastWeekUniqueSessions: Number(lastWeekUnique?.count || 0),
			totalTokens: totalTokensVal,
			promptTokens: promptTokensVal,
			completionTokens: completionTokensVal,
			successRate: successRateVal,
			modelUsage,
			dailyRequests: dailyRequests.map((d) => ({
				date: d.date,
				count: Number(d.count),
			})),
			dailySessions: dailySessions.map((d) => ({
				date: d.date,
				count: Number(d.count),
			})),
			recentSessions,
			userRanking,
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
	// Create or update agent session (upsert - keeps latest state per sessionId)
	.post(
		'/',
		async ({ body }) => {
			const typedBody = body as AgentSessionBody;
			const data = {
				userPrompt: typedBody.userPrompt,
				aiResponse: typedBody.aiResponse ?? '',
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
				aiResponse: t.Optional(t.String()),
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
