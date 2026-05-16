-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_credits" INTEGER NOT NULL DEFAULT 0;
