import { Test, TestingModule } from "@nestjs/testing";
import { AllExceptionsFilter } from "./all-exceptions.filter.js";
import { HttpAdapterHost } from "@nestjs/core";
import { LoggerService } from "../logger/logger.service.js";
import { ConfigService } from "@nestjs/config";
import { HttpException, HttpStatus, ArgumentsHost } from "@nestjs/common";
import { ErrorCode } from "../errors/error-codes.js";

describe("AllExceptionsFilter Unit Tests", () => {
  let filter: AllExceptionsFilter;

  const mockHttpAdapter = {
    reply: jest.fn(),
    getRequestUrl: jest.fn().mockReturnValue("/test-url"),
  };

  const mockArgumentsHost = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({}),
      getResponse: jest.fn().mockReturnValue({}),
    }),
  } as unknown as ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        {
          provide: HttpAdapterHost,
          useValue: {
            httpAdapter: mockHttpAdapter,
          },
        },
        {
          provide: LoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "NODE_ENV") return "development";
              return null;
            }),
          },
        },
      ],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
  });

  it("should map HttpException status to correct platforms standard ErrorCodes", () => {
    const exception = new HttpException(
      "Invalid details",
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockHttpAdapter.reply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: ErrorCode.VALIDATION_ERROR,
          message: "Invalid details",
        }),
      }),
      HttpStatus.BAD_REQUEST,
    );
  });
});
