import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "../logger/logger.module.js";
import { RedisService } from "./redis.service.js";

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
