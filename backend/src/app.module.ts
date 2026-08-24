import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
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
import { GithubModule } from "./modules/github/github.module.js";
import { KnowledgeGraphModule } from "./modules/knowledge-graph/knowledge-graph.module.js";
import { SemanticSearchModule } from "./modules/semantic-search/semantic-search.module.js";
import { AiModule } from "./modules/ai/ai.module.js";
import { ArchitectureModule } from "./modules/architecture/architecture.module.js";
import { SystemDesignModule } from "./modules/system-design/system-design.module.js";
import { RedisModule } from "./common/redis/redis.module.js";
import { RequestContextModule } from "./common/request-context/request-context.module.js";
import { RequestContextMiddleware } from "./common/request-context/request-context.middleware.js";

import { APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor.js";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";

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
    GithubModule,
    KnowledgeGraphModule,
    SemanticSearchModule,
    AiModule,
    ArchitectureModule,
    SystemDesignModule,
    RedisModule,
    RequestContextModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
  }
}
