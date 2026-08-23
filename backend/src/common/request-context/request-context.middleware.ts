import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { RequestContextService } from "./request-context.service.js";
import * as crypto from "crypto";

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const store = new Map<string, any>();

    let requestId = req.headers["x-request-id"] as string;
    if (!requestId) {
      requestId = crypto.randomUUID();
    }

    store.set("requestId", requestId);

    res.setHeader("x-request-id", requestId);

    this.contextService.run(store, () => {
      next();
    });
  }
}
