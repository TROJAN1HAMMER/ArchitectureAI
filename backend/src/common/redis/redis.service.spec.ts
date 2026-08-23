import { Test, TestingModule } from "@nestjs/testing";
import { RedisService } from "./redis.service.js";
import { ConfigService } from "@nestjs/config";
import { LoggerService } from "../logger/logger.service.js";

describe("RedisService Unit Tests", () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "REDIS_URL") return "redis://localhost:6379";
              return null;
            }),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it("should initialize and establish client", () => {
    service.onModuleInit();
    expect(service.getClient()).toBeDefined();
  });

  it("should ping Redis successfully", async () => {
    service.onModuleInit();
    const result = await service.ping();
    expect(result).toBe("PONG");
  });
});
