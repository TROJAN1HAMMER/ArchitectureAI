import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { LoggerService } from "./common/logger/logger.service.js";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  // Connect Winston logger wrapper
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Configure body parser payload limits
  const maxBodySize =
    configService.get<string>("MAX_REQUEST_BODY_SIZE") || "10mb";
  app.use(express.json({ limit: maxBodySize }));
  app.use(express.urlencoded({ limit: maxBodySize, extended: true }));

  // Register Helmet security headers with Swagger CSP compatibility
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
          imgSrc: [`'self'`, "data:", "validator.swagger.io"],
        },
      },
    }),
  );

  // Enable Graceful Shutdown hooks
  app.enableShutdownHooks();

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

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle("ArchitectAI API")
    .setDescription(
      "AI-powered Engineering Intelligence & Architecture Platform.\n\n" +
        "### Authentication\n" +
        "This API supports two authentication mechanisms:\n" +
        "1. **Access Tokens**: Short-lived JWTs sent in the `Authorization: Bearer <token>` header.\n" +
        "2. **Refresh Tokens**: Long-lived session tokens stored in an `HttpOnly` cookie automatically set on `/auth/login`.\n\n" +
        "### Operational Features\n" +
        "- Global Rate Limiting & Throttling\n" +
        "- Correlation Tracing via `X-Request-ID`\n" +
        "- Health & Dependency Probes (`/api/v1/health/live`, `/api/v1/health/ready`) \n",
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
  const port =
    configService.get<number>("PORT") ||
    configService.get<number>("app.port") ||
    3001;

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
