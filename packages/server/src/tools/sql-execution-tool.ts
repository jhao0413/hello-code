import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Client } from 'pg';

const createDatabaseConnection = (connectionString: string) => {
  return new Client({
    connectionString,
    connectionTimeoutMillis: 30000, // 30 seconds
    statement_timeout: 60000, // 1 minute
    query_timeout: 60000, // 1 minute
  });
};

const executeQuery = async (client: Client, query: string) => {
  try {
    console.log('Executing query:', query);
    const result = await client.query(query);
    console.log(`Query returned ${result.rows.length} rows`);
    return result.rows;
  } catch (error) {
    throw new Error(
      `Failed to execute query: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const sqlExecutionTool = createTool({
  id: 'sql-execution',
	inputSchema: z.object({
		connectionString: z.string().describe('PostgreSQL connection string'),
		query: z.string().describe('SQL query to execute'),
	}),
	description: 'Executes SQL queries against a PostgreSQL database (SELECT queries only)',
	execute: async ({ context }) => {
		const { connectionString, query } = context;
		if (!connectionString) {
			throw new Error('Missing database connection string');
		}
		if (!query) {
			throw new Error('Missing SQL query');
		}
		const client = createDatabaseConnection(connectionString);

    try {
      console.log('🔌 Connecting to PostgreSQL for query execution...');
      await client.connect();
      console.log('✅ Connected to PostgreSQL for query execution');

      // Security check: only allow SELECT queries
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery.startsWith('select')) {
        throw new Error('Only SELECT queries are allowed for security reasons');
      }

      const result = await executeQuery(client, query);

      console.log('✅ Query executed successfully');

      return {
        success: true,
        data: result,
        rowCount: result.length,
        executedQuery: query,
      };
    } catch (error) {
      console.error('❌ Query execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executedQuery: query,
      };
    } finally {
      await client.end();
    }
  },
});
