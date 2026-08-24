import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface SpanMetadata {
  repositoryId?: string;
  userId?: string;
  operation: string;
  status?: "SUCCESS" | "FAILED";
  [key: string]: any;
}

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly enabled: boolean;
  private readonly serviceName: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>("OTEL_ENABLED") || false;
    this.serviceName =
      this.configService.get<string>("OTEL_SERVICE_NAME") ||
      "architectai-backend";
    this.endpoint =
      this.configService.get<string>("OTEL_EXPORTER_OTLP_ENDPOINT") ||
      "http://localhost:4318";

    if (this.enabled) {
      this.logger.log(
        `OpenTelemetry tracing initialized for '${this.serviceName}' targetting OTLP endpoint '${this.endpoint}'`,
      );
    }
  }

  async traceSpan<T>(
    spanName: string,
    metadata: SpanMetadata,
    workFn: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await workFn();
      const durationMs = Date.now() - startTime;

      if (this.enabled) {
        this.emitOtelSpan(spanName, {
          ...metadata,
          durationMs,
          status: "SUCCESS",
        });
      }

      return result;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;

      if (this.enabled) {
        this.emitOtelSpan(spanName, {
          ...metadata,
          durationMs,
          status: "FAILED",
          errorType: err.name || "Error",
        });
      }

      throw err;
    }
  }

  private emitOtelSpan(spanName: string, attributes: Record<string, any>) {
    // Sanitized telemetry span emission log
    const safeAttrs = { ...attributes };
    delete safeAttrs.prompt;
    delete safeAttrs.codeContent;
    delete safeAttrs.secret;

    this.logger.debug(`[OTEL SPAN] ${spanName}: ${JSON.stringify(safeAttrs)}`);
  }
}
