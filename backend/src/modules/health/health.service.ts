import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { APP_VERSION } from "@architect-ai/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  getLiveness() {
    return {
      status: "ok",
      version: APP_VERSION,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    let databaseStatus = "fail";
    let redisStatus = "fail";
    let pgvectorStatus = "fail";
    let overallHealthy = true;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = "ok";
    } catch {
      overallHealthy = false;
    }

    try {
      const vectorExt = await this.prisma.$queryRaw<Array<{ extname: string }>>`
        SELECT extname FROM pg_extension WHERE extname = 'vector'
      `;
      if (vectorExt && vectorExt.length > 0) {
        pgvectorStatus = "ok";
      } else {
        overallHealthy = false;
      }
    } catch {
      overallHealthy = false;
    }

    try {
      const pong = await this.redisService.ping();
      if (pong === "PONG") {
        redisStatus = "ok";
      } else {
        overallHealthy = false;
      }
    } catch {
      overallHealthy = false;
    }

    const response = {
      status: overallHealthy ? "ok" : "error",
      services: {
        postgres: databaseStatus === "ok" ? "up" : "down",
        redis: redisStatus === "ok" ? "up" : "down",
        pgvector: pgvectorStatus === "ok" ? "up" : "down",
      },
      checks: {
        database: databaseStatus,
        redis: redisStatus,
        pgvector: pgvectorStatus,
      },
      timestamp: new Date().toISOString(),
    };

    if (!overallHealthy) {
      throw new ServiceUnavailableException(response);
    }

    return response;
  }
}
