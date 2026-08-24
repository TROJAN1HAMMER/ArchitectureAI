import { Test, TestingModule } from "@nestjs/testing";
import { AllExceptionsFilter } from "../../common/filters/all-exceptions.filter.js";
import { LoggerService } from "../../common/logger/logger.service.js";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost } from "@nestjs/core";
import { HttpStatus, HttpException } from "@nestjs/common";
import { RedisLockService } from "../../common/redis/redis-lock.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { ConflictException } from "@nestjs/common";

describe("Phase 11 Platform Security & Exception Filter Unit Tests", () => {
  let exceptionFilter: AllExceptionsFilter;

  const mockHttpAdapter = {
    reply: jest.fn(),
  };

  const mockHttpAdapterHost = {
    httpAdapter: mockHttpAdapter as any,
  } as unknown as HttpAdapterHost;

  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue("development"),
  };

  const mockHost = {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue({}),
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        { provide: HttpAdapterHost, useValue: mockHttpAdapterHost },
        { provide: LoggerService, useValue: mockLogger },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    exceptionFilter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
  });

  it("should format standardized error envelope for HttpExceptions", () => {
    const exception = new HttpException(
      "Repository not found",
      HttpStatus.NOT_FOUND,
    );

    exceptionFilter.catch(exception, mockHost as any);

    expect(mockHttpAdapter.reply).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "RESOURCE_NOT_FOUND",
          message: "Repository not found",
        }),
        requestId: expect.any(String),
      }),
      HttpStatus.NOT_FOUND,
    );
  });

  it("should format standardized error envelope for 429 Too Many Requests", () => {
    const exception = new HttpException(
      "Throttled",
      HttpStatus.TOO_MANY_REQUESTS,
    );

    exceptionFilter.catch(exception, mockHost as any);

    expect(mockHttpAdapter.reply).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "RATE_LIMIT_EXCEEDED",
        }),
      }),
      HttpStatus.TOO_MANY_REQUESTS,
    );
  });
});

describe("RedisLockService Unit Tests", () => {
  let redisLockService: RedisLockService;

  const mockRedisClient = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockRedisService = {
    getClient: () => mockRedisClient,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisLockService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    redisLockService = module.get<RedisLockService>(RedisLockService);
  });

  it("should acquire lock, run function, and release lock with token match", async () => {
    mockRedisClient.set.mockResolvedValue("OK");
    mockRedisClient.get.mockImplementation(async () => {
      return mockRedisClient.set.mock.calls[0][1];
    });
    mockRedisClient.del.mockResolvedValue(1);

    const workFn = jest.fn().mockResolvedValue("WORK_RESULT");
    const result = await redisLockService.runWithLock(
      "test:lock:1",
      60,
      workFn,
    );

    expect(result).toBe("WORK_RESULT");
    expect(workFn).toHaveBeenCalled();
    expect(mockRedisClient.del).toHaveBeenCalledWith("test:lock:1");
  });

  it("should throw ConflictException if lock is already held", async () => {
    mockRedisClient.set.mockResolvedValue(null);

    const workFn = jest.fn();

    await expect(
      redisLockService.runWithLock("test:lock:2", 60, workFn, "Lock busy"),
    ).rejects.toThrow(ConflictException);

    expect(workFn).not.toHaveBeenCalled();
  });
});
