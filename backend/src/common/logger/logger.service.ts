import { Injectable, LoggerService as NestLoggerService } from "@nestjs/common";
import * as winston from "winston";
import { RequestContextService } from "../request-context/request-context.service.js";

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const logLevel =
      process.env.LOG_LEVEL ||
      (process.env.NODE_ENV === "production" ? "info" : "debug");

    this.logger = winston.createLogger({
      level: logLevel,
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
                const sanitizedMsg = this.sanitize(message);
                return `[ArchitectAI] ${timestamp} ${level}:${ctx}${reqIdStr} ${sanitizedMsg}${stk}`;
              },
            ),
          ),
        }),
      ],
    });
  }

  private sanitize(message: any): string {
    if (typeof message !== "string") {
      try {
        message = JSON.stringify(message);
      } catch {
        message = String(message);
      }
    }

    // Mask sensitive keys/tokens
    return message
      .replace(
        /("?(password|secret|jwt|token|access_token|api_key|authorization)"?\s*:\s*"')[^"']+/gi,
        "$1[REDACTED]",
      )
      .replace(/(Bearer\s+)[A-Za-z0-9\-\._~\+\/]+=*/gi, "$1[REDACTED]");
  }

  log(message: any, context?: string) {
    this.logger.info(this.sanitize(message), { context });
  }

  error(message: any, stack?: string, context?: string) {
    this.logger.error(this.sanitize(message), { stack, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(this.sanitize(message), { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(this.sanitize(message), { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(this.sanitize(message), { context });
  }
}
