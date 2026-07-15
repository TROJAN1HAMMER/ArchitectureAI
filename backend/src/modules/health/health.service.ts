import { Injectable } from "@nestjs/common";
import { APP_VERSION } from "@architect-ai/shared";

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
    };
  }
}
