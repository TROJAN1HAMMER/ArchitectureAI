import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { HealthService } from "./health.service.js";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: "Get application overall health and version status",
  })
  @ApiResponse({ status: 200, description: "Application status" })
  getHealth() {
    return this.healthService.getLiveness();
  }

  @Get("live")
  @ApiOperation({ summary: "Get application liveness status" })
  @ApiResponse({ status: 200, description: "Application process is running" })
  getLive() {
    return this.healthService.getLiveness();
  }

  @Get("ready")
  @ApiOperation({ summary: "Get application readiness status" })
  @ApiResponse({
    status: 200,
    description:
      "Application dependencies (PostgreSQL, Redis, pgvector) are available",
  })
  @ApiResponse({
    status: 503,
    description: "Application dependencies failed readiness checks",
  })
  async getReady() {
    return this.healthService.getReadiness();
  }
}
