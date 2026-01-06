-- Users table comments
COMMENT ON TABLE users IS 'User accounts in the system';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.email IS 'User''s email address';
COMMENT ON COLUMN users.name IS 'User''s display name';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when the user was last updated';

-- Agents table comments
COMMENT ON TABLE agents IS 'AI agents with custom configurations';
COMMENT ON COLUMN agents.id IS 'Unique identifier for the agent';
COMMENT ON COLUMN agents.name IS 'Name of the agent';
COMMENT ON COLUMN agents.description IS 'Description of the agent''s purpose';
COMMENT ON COLUMN agents.model IS 'AI model used by the agent';
COMMENT ON COLUMN agents.system_prompt IS 'System prompt that defines the agent''s behavior';
COMMENT ON COLUMN agents.status IS 'Current status of the agent';
COMMENT ON COLUMN agents.config IS 'Additional configuration for the agent';
COMMENT ON COLUMN agents.created_at IS 'Timestamp when the agent was created';
COMMENT ON COLUMN agents.updated_at IS 'Timestamp when the agent was last updated';
COMMENT ON COLUMN agents."userId" IS 'Foreign key reference to users table';

-- Conversations table comments
COMMENT ON TABLE conversations IS 'Chat conversations between users and agents';
COMMENT ON COLUMN conversations.id IS 'Unique identifier for the conversation';
COMMENT ON COLUMN conversations.title IS 'Title of the conversation';
COMMENT ON COLUMN conversations.created_at IS 'Timestamp when the conversation was created';
COMMENT ON COLUMN conversations.updated_at IS 'Timestamp when the conversation was last updated';
COMMENT ON COLUMN conversations."userId" IS 'Foreign key reference to users table';
COMMENT ON COLUMN conversations."agentId" IS 'Foreign key reference to agents table';

-- Messages table comments
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON COLUMN messages.id IS 'Unique identifier for the message';
COMMENT ON COLUMN messages.role IS 'Role of the message sender (user, assistant, or system)';
COMMENT ON COLUMN messages.content IS 'Content of the message';
COMMENT ON COLUMN messages.metadata IS 'Additional metadata for the message';
COMMENT ON COLUMN messages.created_at IS 'Timestamp when the message was created';
COMMENT ON COLUMN messages."conversationId" IS 'Foreign key reference to conversations table';

-- Agent sessions table comments
COMMENT ON TABLE agent_sessions IS 'Sessions tracking agent interactions and metrics';
COMMENT ON COLUMN agent_sessions.id IS 'Unique identifier for the agent session';
COMMENT ON COLUMN agent_sessions.session_id IS 'External session ID provided by the client';
COMMENT ON COLUMN agent_sessions.user_prompt IS 'User''s question or prompt';
COMMENT ON COLUMN agent_sessions.prompt_tokens IS 'Number of input tokens used';
COMMENT ON COLUMN agent_sessions.completion_tokens IS 'Number of output tokens generated';
COMMENT ON COLUMN agent_sessions.total_tokens IS 'Total number of tokens used';
COMMENT ON COLUMN agent_sessions.success IS 'Whether the session completed successfully';
COMMENT ON COLUMN agent_sessions.duration IS 'Duration of the session in milliseconds';
COMMENT ON COLUMN agent_sessions.turns_count IS 'Number of conversation turns';
COMMENT ON COLUMN agent_sessions.tool_calls_count IS 'Number of tool calls made during the session';
COMMENT ON COLUMN agent_sessions.model IS 'AI model used in the session';
COMMENT ON COLUMN agent_sessions.languages IS 'Programming languages used in the session';
COMMENT ON COLUMN agent_sessions.timestamp IS 'Client-side timestamp';
COMMENT ON COLUMN agent_sessions.created_at IS 'Timestamp when the session was created';
COMMENT ON COLUMN agent_sessions."userId" IS 'Foreign key reference to users table';
