import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import appConfig from "./common/config/app.config.js";
import databaseConfig from "./common/config/database.config.js";
import { validate } from "./common/config/validation.js";
import { LoggerModule } from "./common/logger/logger.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { RepositoryModule } from "./modules/repository/repository.module.js";

import { APP_INTERCEPTOR } from "@nestjs/core";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      validate,
    }),
    LoggerModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RepositoryModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
