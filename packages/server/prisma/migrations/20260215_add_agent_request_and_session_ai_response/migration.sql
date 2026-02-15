-- Add nullable AI response to aggregated session row
ALTER TABLE "agentSession"
ADD COLUMN "aiResponse" TEXT;

-- Create per-request log table
CREATE TABLE "agentRequest" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "duration" INTEGER NOT NULL,
    "turnsCount" INTEGER NOT NULL,
    "toolCallsCount" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "languages" TEXT[] NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "agentRequest_pkey" PRIMARY KEY ("id")
);

-- Indexes for dashboard queries and session drill-downs
CREATE INDEX "agentRequest_userId_idx" ON "agentRequest"("userId");
CREATE INDEX "agentRequest_sessionId_idx" ON "agentRequest"("sessionId");
CREATE INDEX "agentRequest_timestamp_idx" ON "agentRequest"("timestamp");

-- Keep referential integrity with user table
ALTER TABLE "agentRequest"
ADD CONSTRAINT "agentRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
