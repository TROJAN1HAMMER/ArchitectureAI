import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { LoggerService } from "../logger/logger.service.js";
import { ErrorCode } from "../errors/error-codes.js";
import { RequestContextService } from "../request-context/request-context.service.js";
import { ConfigService } from "@nestjs/config";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    let errorMessage = "Internal server error";
    let errorDetails: any[] = [];

    const isProduction =
      this.configService.get<string>("NODE_ENV") === "production";

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === "string") {
        errorMessage = response;
      } else if (typeof response === "object" && response !== null) {
        const resObj = response as any;
        errorMessage =
          typeof resObj.message === "string"
            ? resObj.message
            : exception.message || "Error occurred";
        if (Array.isArray(resObj.message)) {
          errorMessage = "Validation failed";
          errorDetails = resObj.message;
        }
      }

      switch (httpStatus) {
        case HttpStatus.UNAUTHORIZED:
          if (
            errorMessage.toLowerCase().includes("password") ||
            errorMessage.toLowerCase().includes("email") ||
            errorMessage.toLowerCase().includes("credential") ||
            errorMessage.toLowerCase().includes("invalid")
          ) {
            errorCode = ErrorCode.AUTH_INVALID_CREDENTIALS;
          } else {
            errorCode = ErrorCode.AUTH_UNAUTHORIZED;
          }
          break;
        case HttpStatus.FORBIDDEN:
          errorCode = ErrorCode.AUTH_FORBIDDEN;
          break;
        case HttpStatus.BAD_REQUEST:
          errorCode = ErrorCode.VALIDATION_ERROR;
          break;
        case HttpStatus.NOT_FOUND:
          errorCode = ErrorCode.RESOURCE_NOT_FOUND;
          break;
        case HttpStatus.CONFLICT:
          errorCode = ErrorCode.CONFLICT;
          break;
        case HttpStatus.TOO_MANY_REQUESTS:
          errorCode = ErrorCode.RATE_LIMIT_EXCEEDED;
          errorMessage = "Rate limit exceeded. Please try again later.";
          break;
        default:
          errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      }
    } else if (exception instanceof Error) {
      errorMessage = isProduction ? "Internal server error" : exception.message;
    }

    const requestId = RequestContextService.getRequestId() || "unknown";

    const responseBody = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
      },
      requestId,
      meta: {
        requestId,
      },
    };

    this.logger.error(
      `Http Status: ${httpStatus} ErrorCode: ${errorCode} ErrorMessage: ${errorMessage} RequestId: ${requestId}`,
      exception instanceof Error ? exception.stack : undefined,
      "AllExceptionsFilter",
    );

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
