import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { LoggerService } from "./common/logger/logger.service.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  // Connect Winston logger wrapper
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Parse Cookie Headers
  app.use(cookieParser());

  // Enable CORS with environment-based credentials configuration
  const allowedOrigins =
    configService.get<string>("CORS_ALLOWED_ORIGINS") ||
    "http://localhost:3000";
  const originsArray = allowedOrigins.split(",").map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (originsArray.includes(origin) || originsArray.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  });

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
    .setDescription(
      "AI-powered Engineering Intelligence Platform.\n\n" +
        "### Authentication\n" +
        "This API supports two authentication mechanisms:\n" +
        "1. **Access Tokens**: Short-lived JWTs sent in the `Authorization: Bearer <token>` header.\n" +
        "2. **Refresh Tokens**: Long-lived session tokens stored in an `HttpOnly` cookie automatically set on `/auth/login`.",
    )
    .setVersion("v1")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter your JWT access token",
        in: "header",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  // Start app
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
