-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "uuid" UUID NOT NULL,
    "username" VARCHAR(32),
    "first_name" VARCHAR(64) NOT NULL,
    "last_name" VARCHAR(64),
    "phone_number" VARCHAR(20),
    "tier" VARCHAR(16) NOT NULL DEFAULT 'free',
    "credit_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "credit_expires_at" TIMESTAMP(3),
    "referral_code" VARCHAR(32),
    "referred_by" UUID,
    "referral_tier" INTEGER NOT NULL DEFAULT 1,
    "language" VARCHAR(5) NOT NULL DEFAULT 'id',
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "auto_renewal" BOOLEAN NOT NULL DEFAULT false,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "ban_reason" TEXT,
    "banned_at" TIMESTAMP(3),
    "fraud_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" BIGSERIAL NOT NULL,
    "order_id" VARCHAR(64) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "package_name" VARCHAR(32),
    "amount_idr" DECIMAL(12,2) NOT NULL,
    "credits_amount" DECIMAL(10,2),
    "gateway" VARCHAR(16) NOT NULL,
    "gateway_transaction_id" VARCHAR(128),
    "payment_method" VARCHAR(32),
    "payment_channel" VARCHAR(32),
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "status_history" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3) DEFAULT NOW() + INTERVAL '30 minutes',
    "ip_address" INET,
    "user_agent" TEXT,
    "metadata" JSONB,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "job_id" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255),
    "description" TEXT,
    "niche" VARCHAR(32) NOT NULL,
    "platform" VARCHAR(32) NOT NULL,
    "duration" INTEGER NOT NULL,
    "scenes" INTEGER NOT NULL,
    "thumbnail_url" TEXT,
    "video_url" TEXT,
    "download_url" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'processing',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "credits_used" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) DEFAULT NOW() + INTERVAL '30 days',

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" BIGSERIAL NOT NULL,
    "referrer_id" BIGINT NOT NULL,
    "referred_id" BIGINT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "tier" INTEGER NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "available_at" TIMESTAMP(3) NOT NULL,
    "withdrawn_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "plan" VARCHAR(16) NOT NULL,
    "billing_cycle" VARCHAR(16) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMP(3),
    "payment_method_id" VARCHAR(64),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "action" VARCHAR(64) NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_telegram_id_idx" ON "users"("telegram_id");

-- CreateIndex
CREATE INDEX "users_referral_code_idx" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_tier_idx" ON "users"("tier");

-- CreateIndex
CREATE INDEX "users_last_activity_at_idx" ON "users"("last_activity_at");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_order_id_key" ON "transactions"("order_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "videos_job_id_key" ON "videos"("job_id");

-- CreateIndex
CREATE INDEX "videos_user_id_idx" ON "videos"("user_id");

-- CreateIndex
CREATE INDEX "videos_status_idx" ON "videos"("status");

-- CreateIndex
CREATE INDEX "videos_created_at_idx" ON "videos"("created_at");

-- CreateIndex
CREATE INDEX "commissions_referrer_id_idx" ON "commissions"("referrer_id");

-- CreateIndex
CREATE INDEX "commissions_status_idx" ON "commissions"("status");

-- CreateIndex
CREATE INDEX "commissions_available_at_idx" ON "commissions"("available_at");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_current_period_end_idx" ON "subscriptions"("current_period_end");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("telegram_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("telegram_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("telegram_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("telegram_id") ON DELETE RESTRICT ON UPDATE CASCADE;
