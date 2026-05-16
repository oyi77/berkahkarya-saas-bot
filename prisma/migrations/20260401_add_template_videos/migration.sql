CREATE TABLE "template_videos" (
    "id" BIGSERIAL NOT NULL,
    "niche" VARCHAR(32) NOT NULL,
    "title" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "video_url" VARCHAR(512) NOT NULL,
    "thumbnail_url" VARCHAR(512),
    "duration" INTEGER NOT NULL DEFAULT 15,
    "platform" VARCHAR(16) NOT NULL DEFAULT 'tiktok',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "template_videos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "template_videos_niche_is_active_idx" ON "template_videos"("niche", "is_active");
