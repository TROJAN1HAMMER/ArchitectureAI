import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { LoggerService } from "../logger/logger.service.js";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient!: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>("REDIS_URL");
    const host = this.configService.get<string>("REDIS_HOST") || "localhost";
    const port = this.configService.get<number>("REDIS_PORT") || 6379;
    const password = this.configService.get<string>("REDIS_PASSWORD");

    const options: any = {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 100, 3000);
        this.logger.warn(
          `Redis connection retry attempt #${times} delaying ${delay}ms`,
          "RedisService",
        );
        return delay;
      },
    };

    if (password) {
      options.password = password;
    }

    if (redisUrl) {
      this.redisClient = new Redis(redisUrl, options);
    } else {
      this.redisClient = new Redis({
        host,
        port,
        ...options,
      });
    }

    this.redisClient.on("connect", () => {
      this.logger.log("Redis connected successfully", "RedisService");
    });

    this.redisClient.on("ready", () => {
      this.logger.log("Redis is ready to receive commands", "RedisService");
    });

    this.redisClient.on("error", (err) => {
      this.logger.error(
        `Redis client error: ${err.message}`,
        err.stack,
        "RedisService",
      );
    });

    this.redisClient.on("reconnecting", () => {
      this.logger.log("Redis is reconnecting...", "RedisService");
    });
  }

  getClient(): Redis {
    return this.redisClient;
  }

  async ping(): Promise<string> {
    return this.redisClient.ping();
  }

  async onModuleDestroy() {
    this.logger.log("Disconnecting from Redis cleanly...", "RedisService");
    await this.redisClient.quit();
  }
}
