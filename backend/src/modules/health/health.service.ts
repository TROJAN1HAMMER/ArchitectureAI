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
    let overallHealthy = true;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = "ok";
    } catch (err) {
      overallHealthy = false;
    }

    try {
      const pong = await this.redisService.ping();
      if (pong === "PONG") {
        redisStatus = "ok";
      } else {
        overallHealthy = false;
      }
    } catch (err) {
      overallHealthy = false;
    }

    const response = {
      status: overallHealthy ? "ok" : "error",
      checks: {
        database: databaseStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    };

    if (!overallHealthy) {
      throw new ServiceUnavailableException(response);
    }

    return response;
  }
}
