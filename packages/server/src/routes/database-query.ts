import { Elysia, t } from 'elysia';
import type { CoreMessage } from 'ai';
import { Mastra } from '@mastra/core';
import { PinoLogger } from '@mastra/loggers';
import { databaseQueryAgent } from '../agents/database-query-agent.js';

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

export const databaseQueryRoutes = new Elysia({ prefix: '/api/database' })
  // Endpoint for chatting with database query agent
  .post(
    '/query',
    async ({ body }) => {
      const { messages, connectionString } = body as {
        messages: UIMessage[];
        connectionString: string;
      };

      // Validate connection string
      if (!connectionString) {
        return {
          error: 'Database connection string is required',
          status: 400,
        };
      }

      const coreMessages = convertToCoreMessages(messages);

      // Add connection string to the first user message context
      // This allows the agent to use it with the tools
      const enhancedMessages: CoreMessage[] = coreMessages.map((msg, index) => {
        if (index === 0 && msg.role === 'user') {
          return {
            ...msg,
            content: `[Connection String: ${connectionString}]\n\n${msg.content}`,
          };
        }
        return msg;
      });

      const mastra = new Mastra({
        agents: { databaseQueryAgent },
        logger:
          process.env.NODE_ENV === 'development'
            ? new PinoLogger({
                name: 'DatabaseQueryAgent',
                level: 'debug',
              })
            : undefined,
      });

      const agent = mastra.getAgent('databaseQueryAgent');

      // Create runtime context with connection string
      const runtimeContext = {
        connectionString,
      };

      const stream = await agent.stream(enhancedMessages, {
        format: 'aisdk',
        context: runtimeContext,
      });

      return stream.toUIMessageStreamResponse();
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
              })
            ),
          })
        ),
        connectionString: t.String(),
      }),
    }
  )
  // Endpoint for testing database connection
  .post(
    '/test-connection',
    async ({ body }) => {
      const { connectionString } = body as { connectionString: string };

      try {
        // Use the introspection tool to test connection
        const { Client } = await import('pg');
        const client = new Client({
          connectionString,
          connectionTimeoutMillis: 5000,
        });

        await client.connect();
        await client.query('SELECT 1');
        await client.end();

        return {
          success: true,
          message: 'Database connection successful',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    {
      body: t.Object({
        connectionString: t.String(),
      }),
    }
  )
  // Endpoint for quick introspection without agent
  .post(
    '/introspect',
    async ({ body }) => {
      const { connectionString } = body as { connectionString: string };

      try {
        const { databaseIntrospectionTool } = await import(
          '../tools/database-introspection-tool.js'
        );

        const result = await databaseIntrospectionTool.execute({
          context: { connectionString },
        });

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    {
      body: t.Object({
        connectionString: t.String(),
      }),
    }
  )
  // Endpoint for generating SQL without executing
  .post(
    '/generate-sql',
    async ({ body }) => {
      const { naturalLanguageQuery, connectionString } = body as {
        naturalLanguageQuery: string;
        connectionString: string;
      };

      try {
        // First introspect to get schema
        const { databaseIntrospectionTool } = await import(
          '../tools/database-introspection-tool.js'
        );
        const schema = await databaseIntrospectionTool.execute({
          context: { connectionString },
        });

        // Then generate SQL
        const { sqlGenerationTool } = await import('../tools/sql-generation-tool.js');
        const result = await sqlGenerationTool.execute({
          context: {
            naturalLanguageQuery,
            databaseSchema: schema,
          },
        });

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    {
      body: t.Object({
        naturalLanguageQuery: t.String(),
        connectionString: t.String(),
      }),
    }
  )
  // Endpoint for executing SQL directly
  .post(
    '/execute-sql',
    async ({ body }) => {
      const { query, connectionString } = body as {
        query: string;
        connectionString: string;
      };

      try {
        const { sqlExecutionTool } = await import('../tools/sql-execution-tool.js');

        const result = await sqlExecutionTool.execute({
          context: {
            query,
            connectionString,
          },
        });

        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    {
      body: t.Object({
        query: t.String(),
        connectionString: t.String(),
      }),
    }
  );
