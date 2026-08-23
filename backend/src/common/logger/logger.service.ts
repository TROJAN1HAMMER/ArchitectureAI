import { Injectable, LoggerService as NestLoggerService } from "@nestjs/common";
import * as winston from "winston";
import { RequestContextService } from "../request-context/request-context.service.js";

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(
              ({ timestamp, level, message, context, stack }) => {
                const ctx = context ? ` [${context}]` : "";
                const stk = stack ? `\n${stack}` : "";
                const requestId = RequestContextService.getRequestId();
                const reqIdStr = requestId ? ` [requestId=${requestId}]` : "";
                return `[ArchitectAI] ${timestamp} ${level}:${ctx}${reqIdStr} ${message}${stk}`;
              },
            ),
          ),
        }),
      ],
    });
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, stack?: string, context?: string) {
    this.logger.error(message, { stack, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }
}
