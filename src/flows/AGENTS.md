<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# flows

## Purpose
Video generation orchestration. Bridges the user's completed create form to the BullMQ job queue.

## Key Files

| File | Description |
|------|-------------|
| `generate.ts` | `executeGeneration()` — creates BullMQ video-generation jobs. Handles image set generation, aspect ratio, resolution tier. Most frequently modified file in the codebase. |

## For AI Agents

### Working In This Directory
- `executeGeneration()` is the critical path between user input and video pipeline
- Changes here affect the entire video creation workflow
- Test thoroughly — failures mean lost credits and bad UX

### Common Patterns
- Reads from `ctx.session.videoCreation` accumulator
- Enqueues jobs to BullMQ `video-generation` queue

## Dependencies

### Internal
- `@/services/video-generation.service`, `@/services/image.service`
- `@/config/queue`, `@/config/hpas-engine`

### External
- `bullmq`

<!-- MANUAL: -->
