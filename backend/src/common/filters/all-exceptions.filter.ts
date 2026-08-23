import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { LoggerService } from "../logger/logger.service.js";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorCode = "INTERNAL_SERVER_ERROR";
    let errorMessage = "Internal server error";
    let errorDetails: any[] = [];

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
            errorMessage.toLowerCase().includes("credential")
          ) {
            errorCode = "AUTH_INVALID_CREDENTIALS";
          } else if (
            errorMessage.toLowerCase().includes("expired") ||
            errorMessage.toLowerCase().includes("session")
          ) {
            errorCode = "AUTH_SESSION_EXPIRED";
          } else {
            errorCode = "AUTH_UNAUTHORIZED";
          }
          break;
        case HttpStatus.BAD_REQUEST:
          errorCode = "VALIDATION_ERROR";
          break;
        case HttpStatus.NOT_FOUND:
          errorCode = "RESOURCE_NOT_FOUND";
          break;
        default:
          errorCode = "INTERNAL_SERVER_ERROR";
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    const responseBody = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
      },
    };

    this.logger.error(
      `Http Status: ${httpStatus} Error: ${errorMessage} Details: ${JSON.stringify(errorDetails)}`,
      exception instanceof Error ? exception.stack : undefined,
      "AllExceptionsFilter",
    );

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
