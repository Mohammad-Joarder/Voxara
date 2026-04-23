-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'SCALE', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('YOUTUBE', 'TIKTOK', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'REEL', 'SHORT', 'STORY', 'POST');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL', 'AMBIGUOUS');

-- CreateEnum
CREATE TYPE "IntentLevel" AS ENUM ('NONE', 'INTEREST', 'STRONG', 'POST_PURCHASE');

-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('SENTIMENT_SPIKE', 'QUOTA_EXHAUSTED', 'SYNC_FAILED', 'INSIGHT_READY', 'GENERAL');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SyncType" AS ENUM ('SCHEDULED', 'BACKFILL', 'MANUAL', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'QUOTA_EXCEEDED');

-- CreateTable
CREATE TABLE "creators" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "consentAiAnalysis" BOOLEAN NOT NULL DEFAULT false,
    "consentAcceptedAt" TIMESTAMP(3),
    "dataRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "stripeCustomerId" TEXT,
    "planTier" "PlanTier" NOT NULL DEFAULT 'FREE',

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connected_accounts" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platform_user_id" TEXT NOT NULL,
    "platform_username" TEXT NOT NULL,
    "access_token_encrypted" TEXT NOT NULL,
    "refresh_token_encrypted" TEXT NOT NULL,
    "scopes_granted" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "token_expires_at" TIMESTAMP(3) NOT NULL,
    "last_synced_at" TIMESTAMP(3),
    "follower_count" INTEGER,
    "channel_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connected_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "connected_account_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platform_content_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "duration_seconds" INTEGER,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "thumbnail_url" TEXT,
    "content_type" "ContentType" NOT NULL DEFAULT 'VIDEO',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platform_comment_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_id" TEXT,
    "text" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3) NOT NULL,
    "is_reply" BOOLEAN NOT NULL DEFAULT false,
    "parent_comment_id" TEXT,
    "language" TEXT,
    "is_filtered" BOOLEAN NOT NULL DEFAULT false,
    "filter_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sentiment_results" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "sentiment" "Sentiment" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "emotion_joy" DOUBLE PRECISION,
    "emotion_sadness" DOUBLE PRECISION,
    "emotion_anger" DOUBLE PRECISION,
    "emotion_fear" DOUBLE PRECISION,
    "emotion_surprise" DOUBLE PRECISION,
    "emotion_disgust" DOUBLE PRECISION,
    "model_version" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sentiment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cta_extractions" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "explicit_suggestions" JSONB NOT NULL,
    "implicit_signals" JSONB NOT NULL,
    "engagement_drivers" JSONB NOT NULL,
    "cluster_id" TEXT,
    "cluster_label" TEXT,
    "processed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cta_extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intent_signals" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "intent_level" "IntentLevel" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "extracted_entities" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intent_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_cards" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "impact_level" "ImpactLevel" NOT NULL,
    "action_timeframe" TEXT NOT NULL,
    "metric_context" TEXT,
    "is_dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissed_at" TIMESTAMP(3),
    "generated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insight_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "alert_type" "AlertType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_logs" (
    "id" TEXT NOT NULL,
    "connected_account_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "sync_type" "SyncType" NOT NULL,
    "status" "IngestionStatus" NOT NULL,
    "comments_ingested" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingestion_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creators_email_key" ON "creators"("email");

-- CreateIndex
CREATE UNIQUE INDEX "connected_accounts_creator_id_platform_platform_user_id_key" ON "connected_accounts"("creator_id", "platform", "platform_user_id");

-- CreateIndex
CREATE INDEX "content_creator_id_published_at_idx" ON "content"("creator_id", "published_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "content_platform_platform_content_id_key" ON "content"("platform", "platform_content_id");

-- CreateIndex
CREATE INDEX "comments_creator_id_published_at_idx" ON "comments"("creator_id", "published_at" DESC);

-- CreateIndex
CREATE INDEX "comments_content_id_published_at_idx" ON "comments"("content_id", "published_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "comments_platform_platform_comment_id_key" ON "comments"("platform", "platform_comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "sentiment_results_comment_id_key" ON "sentiment_results"("comment_id");

-- CreateIndex
CREATE INDEX "sentiment_results_creator_id_processed_at_idx" ON "sentiment_results"("creator_id", "processed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "cta_extractions_comment_id_key" ON "cta_extractions"("comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "intent_signals_comment_id_key" ON "intent_signals"("comment_id");

-- CreateIndex
CREATE INDEX "intent_signals_creator_id_confidence_idx" ON "intent_signals"("creator_id", "confidence" DESC);

-- CreateIndex
CREATE INDEX "alerts_creator_id_is_read_created_at_idx" ON "alerts"("creator_id", "is_read", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_connected_account_id_fkey" FOREIGN KEY ("connected_account_id") REFERENCES "connected_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sentiment_results" ADD CONSTRAINT "sentiment_results_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sentiment_results" ADD CONSTRAINT "sentiment_results_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cta_extractions" ADD CONSTRAINT "cta_extractions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cta_extractions" ADD CONSTRAINT "cta_extractions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intent_signals" ADD CONSTRAINT "intent_signals_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intent_signals" ADD CONSTRAINT "intent_signals_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_cards" ADD CONSTRAINT "insight_cards_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_logs" ADD CONSTRAINT "ingestion_logs_connected_account_id_fkey" FOREIGN KEY ("connected_account_id") REFERENCES "connected_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_logs" ADD CONSTRAINT "ingestion_logs_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
