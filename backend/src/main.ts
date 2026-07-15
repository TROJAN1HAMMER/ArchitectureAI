import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { LoggerService } from "./common/logger/logger.service.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Connect Winston logger wrapper
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Global Prefix
  app.setGlobalPrefix("api/v1");

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Exceptions Filter
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost, logger));

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle("ArchitectAI API")
    .setDescription("AI-powered Engineering Intelligence Platform")
    .setVersion("v1")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  // Start app
  const configService = app.get(ConfigService);
  const port = configService.get<number>("app.port") || 3000;

  await app.listen(port);
  logger.log(
    `🚀 Backend server successfully started on port ${port}`,
    "Bootstrap",
  );
  logger.log(
    `Documentation available at http://localhost:${port}/api/docs`,
    "Bootstrap",
  );
}

bootstrap();
