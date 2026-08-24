import { Injectable, ConflictException, Logger } from "@nestjs/common";
import { RedisService } from "./redis.service.js";
import * as crypto from "crypto";

@Injectable()
export class RedisLockService {
  private readonly logger = new Logger(RedisLockService.name);

  constructor(private readonly redisService: RedisService) {}

  async runWithLock<T>(
    key: string,
    ttlSeconds: number,
    workFn: () => Promise<T>,
    conflictMessage = "Operation is already in progress for this repository",
  ): Promise<T> {
    const redis = this.redisService.getClient();
    const lockToken = crypto.randomUUID();

    const acquired = await redis.set(key, lockToken, "EX", ttlSeconds, "NX");
    if (!acquired) {
      throw new ConflictException(conflictMessage);
    }

    try {
      return await workFn();
    } finally {
      try {
        const val = await redis.get(key);
        if (val === lockToken) {
          await redis.del(key);
        }
      } catch (err) {
        this.logger.error(`Failed to release Redis lock '${key}'`, err);
      }
    }
  }
}
