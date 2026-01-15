import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

// Schema for the database metadata
const databaseSchemaSchema = z.object({
  tables: z.array(z.any()),
  columns: z.array(z.any()),
  relationships: z.array(z.any()),
  indexes: z.array(z.any()),
  rowCounts: z.array(z.any()),
  summary: z.object({
    total_tables: z.number(),
    total_columns: z.number(),
    total_relationships: z.number(),
    total_indexes: z.number(),
  }),
});

// Output schema for SQL generation
const sqlGenerationSchema = z.object({
  sql: z.string().describe('The generated SQL query'),
  explanation: z.string().describe('Explanation of what the query does'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score between 0 and 1'),
  assumptions: z
    .array(z.string())
    .describe('Any assumptions made while generating the query'),
  tables_used: z.array(z.string()).describe('List of tables used in the query'),
});

// Helper function to create a readable schema description
function createSchemaDescription(schema: z.infer<typeof databaseSchemaSchema>): string {
  const { tables, columns, relationships, indexes, rowCounts } = schema;

  // Group columns by table
  const tableColumns = new Map<string, any[]>();
  for (const column of columns) {
    const key = `${column.schema_name}.${column.table_name}`;
    if (!tableColumns.has(key)) {
      tableColumns.set(key, []);
    }
    tableColumns.get(key)!.push(column);
  }

  let description = '# Database Schema\n\n';

  for (const table of tables) {
    const tableKey = `${table.schema_name}.${table.table_name}`;
    const tableCols = tableColumns.get(tableKey) || [];
    const rowCount = rowCounts.find(
      (rc: any) => rc.schema_name === table.schema_name && rc.table_name === table.table_name
    );

    description += `## Table: ${table.table_name}\n`;
    description += `Schema: ${table.schema_name}\n`;
    if (rowCount) {
      description += `Row Count: ${rowCount.row_count}\n`;
    }
    description += '\n### Columns:\n';

    for (const col of tableCols) {
      description += `- **${col.column_name}**`;
      description += ` (${col.data_type}`;
      if (col.character_maximum_length) {
        description += `(${col.character_maximum_length})`;
      }
      description += ')';
      if (col.is_primary_key) {
        description += ' [PRIMARY KEY]';
      }
      if (col.is_nullable === 'NO') {
        description += ' [NOT NULL]';
      }
      if (col.column_default) {
        description += ` [DEFAULT: ${col.column_default}]`;
      }
      description += '\n';
    }

    // Add relationships for this table
    const tableRelationships = relationships.filter(
      (rel: any) => rel.schema_name === table.schema_name && rel.table_name === table.table_name
    );

    if (tableRelationships.length > 0) {
      description += '\n### Foreign Keys:\n';
      for (const rel of tableRelationships) {
        description += `- ${rel.column_name} -> ${rel.foreign_schema_name}.${rel.foreign_table_name}.${rel.foreign_column_name}\n`;
      }
    }

    // Add indexes for this table
    const tableIndexes = indexes.filter(
      (idx: any) => idx.schema_name === table.schema_name && idx.table_name === table.table_name
    );

    if (tableIndexes.length > 0) {
      description += '\n### Indexes:\n';
      for (const idx of tableIndexes) {
        description += `- ${idx.index_name}\n`;
      }
    }

    description += '\n---\n\n';
  }

  return description;
}

export const sqlGenerationTool = createTool({
  id: 'sql-generation',
  inputSchema: z.object({
    naturalLanguageQuery: z
      .string()
      .describe('The natural language question to convert to SQL'),
    databaseSchema: databaseSchemaSchema.describe('The database schema information'),
  }),
  description:
    'Converts a natural language question into a PostgreSQL query based on the database schema',
  execute: async ({ context: { naturalLanguageQuery, databaseSchema } }) => {
    const schemaDescription = createSchemaDescription(databaseSchema);

    const systemPrompt = `You are an expert PostgreSQL query generator. Given a database schema and a natural language question, generate an accurate SQL query.

${schemaDescription}

## Query Generation Rules:
1. Generate SELECT queries only (no INSERT, UPDATE, DELETE, DROP, etc.)
2. Use proper joins when querying multiple tables
3. Use table aliases for better readability
4. Always qualify column names with table aliases when joining
5. Use appropriate WHERE clauses for filtering
6. Use ORDER BY for sorting when relevant
7. Use LIMIT when appropriate to avoid returning too many rows
8. Use ILIKE for case-insensitive text searches
9. Consider performance - use indexes when available
10. Handle NULL values appropriately

## Response Format:
Provide a valid SQL query along with:
- A clear explanation of what the query does
- A confidence score (0-1) indicating how confident you are about the query
- Any assumptions you made
- List of tables used in the query`;

    try {
      const result = await generateObject({
        model: openai('gpt-4o'),
        schema: sqlGenerationSchema,
        system: systemPrompt,
        prompt: naturalLanguageQuery,
        temperature: 0.1, // Low temperature for more deterministic results
      });

      console.log('✅ SQL generated successfully:', {
        confidence: result.object.confidence,
        tables_used: result.object.tables_used,
      });

      return result.object;
    } catch (error) {
      console.error('❌ SQL generation failed:', error);
      throw new Error(
        `Failed to generate SQL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});
