import { FastifyInstance } from "fastify";
import { prisma } from "@/config/database";
import { redis } from "@/config/redis";
import { getQueueStats } from "@/config/queue";
import { logger } from "@/utils/logger";
import os from "os";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: { status: string; latency?: number; error?: string };
    redis: { status: string; latency?: number; error?: string };
    queue: { status: string; stats?: any; error?: string };
    memory: { status: string; used: number; total: number; percentage: number };
    cpu: { status: string; load: number[] };
  };
}

interface MetricsData {
  timestamp: string;
  users: {
    total: number;
    active24h: number;
    active7d: number;
    new24h: number;
  };
  videos: {
    total: number;
    completed24h: number;
    failed24h: number;
    processing: number;
  };
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
  };
  performance: {
    avgVideoGenerationTime: number;
    avgQueueWaitTime: number;
    errorRate: number;
  };
  system: {
    memoryUsage: number;
    cpuLoad: number[];
    uptime: number;
  };
}

async function checkDatabase(): Promise<{
  status: string;
  latency?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "healthy", latency: Date.now() - start };
  } catch (error: any) {
    logger.error("Database health check failed:", error);
    return { status: "unhealthy", error: error.message };
  }
}

async function checkRedis(): Promise<{
  status: string;
  latency?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    if (!redis) {
      return { status: "degraded", error: "Redis not configured" };
    }
    await redis.ping();
    return { status: "healthy", latency: Date.now() - start };
  } catch (error: any) {
    logger.error("Redis health check failed:", error);
    return { status: "unhealthy", error: error.message };
  }
}

async function checkQueue(): Promise<{
  status: string;
  stats?: any;
  error?: string;
}> {
  try {
    const stats = await getQueueStats();
    const waiting = stats.waiting || 0;
    const failed = stats.failed || 0;

    if (failed > 100) {
      return { status: "unhealthy", stats, error: "Too many failed jobs" };
    }
    if (waiting > 1000) {
      return { status: "degraded", stats, error: "Queue backlog" };
    }
    return { status: "healthy", stats };
  } catch (error: any) {
    logger.error("Queue health check failed:", error);
    return { status: "unhealthy", error: error.message };
  }
}

function checkMemory(): {
  status: string;
  used: number;
  total: number;
  percentage: number;
} {
  const used = process.memoryUsage().heapUsed;
  const total = os.totalmem();
  const percentage = (used / total) * 100;

  let status = "healthy";
  if (percentage > 90) {
    status = "unhealthy";
  } else if (percentage > 75) {
    status = "degraded";
  }

  return { status, used, total, percentage };
}

function checkCPU(): { status: string; load: number[] } {
  const load = os.loadavg();
  const cpuCount = os.cpus().length;

  let status = "healthy";
  if (load[0] > cpuCount * 2) {
    status = "unhealthy";
  } else if (load[0] > cpuCount) {
    status = "degraded";
  }

  return { status, load };
}

export async function monitoringRoutes(server: FastifyInstance): Promise<void> {
  server.get("/health", async (_request, reply) => {
    const [dbCheck, redisCheck, queueCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkQueue(),
    ]);

    const memoryCheck = checkMemory();
    const cpuCheck = checkCPU();

    const health: HealthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "3.0.0",
      checks: {
        database: dbCheck,
        redis: redisCheck,
        queue: queueCheck,
        memory: memoryCheck,
        cpu: cpuCheck,
      },
    };

    const statuses = Object.values(health.checks).map((c) => c.status);
    if (statuses.includes("unhealthy")) {
      health.status = "unhealthy";
      reply.status(503);
    } else if (statuses.includes("degraded")) {
      health.status = "degraded";
      reply.status(200);
    }

    return health;
  });

  server.get("/health/live", async (_request, reply) => {
    reply.status(200).send({ status: "alive" });
  });

  server.get("/health/ready", async (_request, reply) => {
    const [dbCheck, redisCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(),
    ]);

    if (dbCheck.status === "unhealthy" || redisCheck.status === "unhealthy") {
      reply.status(503).send({
        status: "not ready",
        checks: { database: dbCheck, redis: redisCheck },
      });
      return;
    }

    reply.status(200).send({ status: "ready" });
  });

  server.get("/metrics", async (_request, reply) => {
    const MONITORING_SECRET = process.env.MONITORING_SECRET;
    if (MONITORING_SECRET) {
      const auth = _request.headers.authorization;
      if (auth !== `Bearer ${MONITORING_SECRET}`) {
        reply.status(401).send({ error: "Unauthorized" });
        return;
      }
    }

    try {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalUsers,
        active24h,
        active7d,
        new24h,
        totalVideos,
        completed24h,
        failed24h,
        processing,
        totalRevenue,
        todayRevenue,
        monthRevenue,
        avgGenTime,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { lastActivityAt: { gte: dayAgo } } }),
        prisma.user.count({ where: { lastActivityAt: { gte: weekAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
        prisma.video.count(),
        prisma.video.count({
          where: { status: "completed", updatedAt: { gte: dayAgo } },
        }),
        prisma.video.count({
          where: { status: "failed", updatedAt: { gte: dayAgo } },
        }),
        prisma.video.count({ where: { status: "processing" } }),
        prisma.transaction.aggregate({
          where: { status: "success" },
          _sum: { amountIdr: true },
        }),
        prisma.transaction.aggregate({
          where: { status: "success", paidAt: { gte: dayAgo } },
          _sum: { amountIdr: true },
        }),
        prisma.transaction.aggregate({
          where: { status: "success", paidAt: { gte: monthStart } },
          _sum: { amountIdr: true },
        }),
        prisma.video.aggregate({
          where: { status: "completed", generationTimeMs: { not: null } },
          _avg: { generationTimeMs: true },
        }),
      ]);

      const queueStats = await getQueueStats();
      const total24h = completed24h + failed24h;
      const errorRate = total24h > 0 ? (failed24h / total24h) * 100 : 0;

      const metrics: MetricsData = {
        timestamp: now.toISOString(),
        users: {
          total: totalUsers,
          active24h,
          active7d,
          new24h,
        },
        videos: {
          total: totalVideos,
          completed24h,
          failed24h,
          processing,
        },
        revenue: {
          total: Number(totalRevenue._sum.amountIdr || 0),
          today: Number(todayRevenue._sum.amountIdr || 0),
          thisMonth: Number(monthRevenue._sum.amountIdr || 0),
        },
        performance: {
          avgVideoGenerationTime: avgGenTime._avg.generationTimeMs || 0,
          avgQueueWaitTime: queueStats.waiting || 0,
          errorRate: Math.round(errorRate * 100) / 100,
        },
        system: {
          memoryUsage: process.memoryUsage().heapUsed,
          cpuLoad: os.loadavg(),
          uptime: process.uptime(),
        },
      };

      return metrics;
    } catch (error) {
      logger.error("Error collecting metrics:", error);
      reply.status(500).send({ error: "Failed to collect metrics" });
    }
  });

  server.get("/metrics/prometheus", async (_request, reply) => {
    const MONITORING_SECRET = process.env.MONITORING_SECRET;
    if (MONITORING_SECRET) {
      const auth = _request.headers.authorization;
      if (auth !== `Bearer ${MONITORING_SECRET}`) {
        reply.status(401).send({ error: "Unauthorized" });
        return;
      }
    }

    try {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        active24h,
        totalVideos,
        completed24h,
        failed24h,
        processing,
        revenue24h,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { lastActivityAt: { gte: dayAgo } } }),
        prisma.video.count(),
        prisma.video.count({
          where: { status: "completed", updatedAt: { gte: dayAgo } },
        }),
        prisma.video.count({
          where: { status: "failed", updatedAt: { gte: dayAgo } },
        }),
        prisma.video.count({ where: { status: "processing" } }),
        prisma.transaction.aggregate({
          where: { status: "success", paidAt: { gte: dayAgo } },
          _sum: { amountIdr: true },
        }),
      ]);

      const mem = process.memoryUsage();
      const cpu = os.loadavg();

      const prometheusMetrics = [
        `# HELP openclaw_users_total Total number of users`,
        `# TYPE openclaw_users_total gauge`,
        `openclaw_users_total ${totalUsers}`,
        ``,
        `# HELP openclaw_users_active_24h Active users in last 24 hours`,
        `# TYPE openclaw_users_active_24h gauge`,
        `openclaw_users_active_24h ${active24h}`,
        ``,
        `# HELP openclaw_videos_total Total videos generated`,
        `# TYPE openclaw_videos_total gauge`,
        `openclaw_videos_total ${totalVideos}`,
        ``,
        `# HELP openclaw_videos_completed_24h Videos completed in last 24 hours`,
        `# TYPE openclaw_videos_completed_24h gauge`,
        `openclaw_videos_completed_24h ${completed24h}`,
        ``,
        `# HELP openclaw_videos_failed_24h Videos failed in last 24 hours`,
        `# TYPE openclaw_videos_failed_24h gauge`,
        `openclaw_videos_failed_24h ${failed24h}`,
        ``,
        `# HELP openclaw_videos_processing Videos currently processing`,
        `# TYPE openclaw_videos_processing gauge`,
        `openclaw_videos_processing ${processing}`,
        ``,
        `# HELP openclaw_revenue_24h_idr Revenue in last 24 hours (IDR)`,
        `# TYPE openclaw_revenue_24h_idr gauge`,
        `openclaw_revenue_24h_idr ${revenue24h._sum.amountIdr || 0}`,
        ``,
        `# HELP openclaw_memory_heap_used_bytes Process heap memory used`,
        `# TYPE openclaw_memory_heap_used_bytes gauge`,
        `openclaw_memory_heap_used_bytes ${mem.heapUsed}`,
        ``,
        `# HELP openclaw_memory_heap_total_bytes Process heap memory total`,
        `# TYPE openclaw_memory_heap_total_bytes gauge`,
        `openclaw_memory_heap_total_bytes ${mem.heapTotal}`,
        ``,
        `# HELP openclaw_memory_rss_bytes Process RSS memory`,
        `# TYPE openclaw_memory_rss_bytes gauge`,
        `openclaw_memory_rss_bytes ${mem.rss}`,
        ``,
        `# HELP openclaw_cpu_load_1m CPU load average 1 minute`,
        `# TYPE openclaw_cpu_load_1m gauge`,
        `openclaw_cpu_load_1m ${cpu[0]}`,
        ``,
        `# HELP openclaw_cpu_load_5m CPU load average 5 minutes`,
        `# TYPE openclaw_cpu_load_5m gauge`,
        `openclaw_cpu_load_5m ${cpu[1]}`,
        ``,
        `# HELP openclaw_cpu_load_15m CPU load average 15 minutes`,
        `# TYPE openclaw_cpu_load_15m gauge`,
        `openclaw_cpu_load_15m ${cpu[2]}`,
        ``,
        `# HELP openclaw_uptime_seconds Process uptime in seconds`,
        `# TYPE openclaw_uptime_seconds gauge`,
        `openclaw_uptime_seconds ${Math.floor(process.uptime())}`,
      ].join("\n");

      reply.type("text/plain").send(prometheusMetrics);
    } catch (error) {
      logger.error("Error generating Prometheus metrics:", error);
      reply.status(500).send({ error: "Failed to generate metrics" });
    }
  });
}
