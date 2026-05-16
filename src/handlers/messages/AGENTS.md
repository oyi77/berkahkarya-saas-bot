<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 -->

# Message Sub-Handlers

Sub-handlers for specific message input types: file uploads, rich media, and special content types.

## Purpose

Parse and process user-submitted media (video, image, audio files) during multi-step workflows. Integrated into the main message handler dispatcher based on session state.

## Key Files

| File | Purpose |
|---|
| `video-uploader.ts` | Handle uploaded video/image files — extract frames, analyze content, enqueue disassembly jobs |

## Subdirectories

None.

## For AI Agents

**Entry point:** Export async function `handleDisassemble(ctx: BotContext): Promise<void>`.

**Media detection:** Check `ctx.message.video`, `ctx.message.photo`, `ctx.message.document` to identify media type and extract `file_id`.

**File download:** Use Telegraf's `getFile()` to download media from Telegram servers.

**Processing:** Call external tools (ffmpeg, OpenCV, or AI services) to analyze frames, extract metadata, or generate previews.

**Queueing:** Enqueue analysis/generation jobs to BullMQ for async processing.

**User feedback:** Send progress messages via `ctx.reply()` with translated text.

## Dependencies

- `@/types` — `BotContext`
- `@/services/user.service` — User lookup
- `@/services/content-analysis.service` — Frame extraction and analysis
- `@/services/video.service` — Video metadata CRUD
- `@/config/queue` — BullMQ job enqueueing
- `@/config/pricing` — Credit cost lookup
- `@/i18n/translations` — Localized messages
- Child process execution (ffmpeg, etc.)

## Testing

Unit tests mock file downloads and external tool calls. Integration tests verify file upload flows with real Telegraf context.

<!-- MANUAL: -->
Always validate media type before processing.
Handle upload failures gracefully with user-friendly error messages.
Use async queuing for long-running media processing.
