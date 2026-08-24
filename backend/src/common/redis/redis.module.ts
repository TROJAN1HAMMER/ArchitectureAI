import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "../logger/logger.module.js";
import { RedisService } from "./redis.service.js";
import { RedisLockService } from "./redis-lock.service.js";

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [RedisService, RedisLockService],
  exports: [RedisService, RedisLockService],
})
export class RedisModule {}
