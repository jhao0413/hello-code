-- Rename tables from PascalCase to camelCase
-- This preserves all data and relationships

-- Rename User table to user
ALTER TABLE "User" RENAME TO "user";

-- Rename Account table to account
ALTER TABLE "Account" RENAME TO "account";

-- Rename Session table to session
ALTER TABLE "Session" RENAME TO "session";

-- Rename VerificationToken table to verificationToken
ALTER TABLE "VerificationToken" RENAME TO "verificationToken";

-- Rename Agent table to agent
ALTER TABLE "Agent" RENAME TO "agent";

-- Rename Conversation table to conversation
ALTER TABLE "Conversation" RENAME TO "conversation";

-- Rename Message table to message
ALTER TABLE "Message" RENAME TO "message";

-- Rename AgentSession table to agentSession
ALTER TABLE "AgentSession" RENAME TO "agentSession";
