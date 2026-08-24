import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TelemetryService } from "./telemetry.service.js";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
