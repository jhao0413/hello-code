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
    const result = await client.query(query);
    return result.rows;
  } catch (error) {
    throw new Error(
      `Failed to execute query: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const databaseIntrospectionTool = createTool({
  id: 'database-introspection',
  inputSchema: z.object({
    connectionString: z.string().describe('PostgreSQL connection string'),
  }),
	description:
		'Introspects a PostgreSQL database to understand its schema, tables, columns, and relationships',
	execute: async ({ context }) => {
		const { connectionString } = context;
		if (!connectionString) {
			throw new Error('Missing database connection string');
		}
		const client = createDatabaseConnection(connectionString);

    try {
      console.log('🔌 Connecting to PostgreSQL for introspection...');
      await client.connect();
      console.log('✅ Connected to PostgreSQL for introspection');

      // Query to get all tables
      const tablesQuery = `
        SELECT
          schemaname as schema_name,
          tablename as table_name,
          tableowner as table_owner
        FROM pg_tables
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        ORDER BY schemaname, tablename;
      `;

      const tables = await executeQuery(client, tablesQuery);

      // Query to get all columns with details
      const columnsQuery = `
        SELECT
          c.table_schema as schema_name,
          c.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.character_maximum_length,
          c.numeric_precision,
          c.numeric_scale,
          CASE
            WHEN pk.column_name IS NOT NULL THEN true
            ELSE false
          END as is_primary_key
        FROM information_schema.columns c
        LEFT JOIN (
          SELECT ku.table_schema, ku.table_name, ku.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku
            ON tc.constraint_name = ku.constraint_name
            AND tc.table_schema = ku.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
        ) pk
          ON c.table_schema = pk.table_schema
          AND c.table_name = pk.table_name
          AND c.column_name = pk.column_name
        WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY c.table_schema, c.table_name, c.ordinal_position;
      `;

      const columns = await executeQuery(client, columnsQuery);

      // Query to get foreign key relationships
      const relationshipsQuery = `
        SELECT
          tc.table_schema as schema_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_schema AS foreign_schema_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY tc.table_schema, tc.table_name, kcu.column_name;
      `;

      const relationships = await executeQuery(client, relationshipsQuery);

      // Query to get indexes
      const indexesQuery = `
        SELECT
          schemaname as schema_name,
          tablename as table_name,
          indexname as index_name,
          indexdef as index_definition
        FROM pg_indexes
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        ORDER BY schemaname, tablename, indexname;
      `;

      const indexes = await executeQuery(client, indexesQuery);

      // Get row counts for each table
      const rowCounts = await Promise.all(
        tables.map(async (table: any) => {
          try {
            const countQuery = `SELECT COUNT(*) as count FROM "${table.schema_name}"."${table.table_name}"`;
            const result = await executeQuery(client, countQuery);
            return {
              schema_name: table.schema_name,
              table_name: table.table_name,
              row_count: parseInt(result[0].count),
            };
          } catch (error) {
            return {
              schema_name: table.schema_name,
              table_name: table.table_name,
              row_count: 0,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        })
      );

      const summary = {
        total_tables: tables.length,
        total_columns: columns.length,
        total_relationships: relationships.length,
        total_indexes: indexes.length,
      };

      console.log('✅ Database introspection completed:', summary);

      return {
        tables,
        columns,
        relationships,
        indexes,
        rowCounts,
        summary,
      };
    } catch (error) {
      console.error('❌ Database introspection failed:', error);
      throw error;
    } finally {
      await client.end();
    }
  },
});
