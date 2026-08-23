import { Test, TestingModule } from "@nestjs/testing";
import {
  INestApplication,
  ValidationPipe,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { Response } from "express";

describe("Authentication & Identity Integration Tests", () => {
  let app: INestApplication;
  let service: AuthService;
  let prisma: PrismaService;

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({}),
      ],
      providers: [AuthService],
      controllers: [AuthController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    service = moduleFixture.get<AuthService>(AuthService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    try {
      await prisma.user.delete({
        where: { email: "test_integration@example.com" },
      });
    } catch (err) {}
  });

  afterAll(async () => {
    try {
      await prisma.user.delete({
        where: { email: "test_integration@example.com" },
      });
    } catch (err) {}
    await prisma.$disconnect();
    await app.close();
  });

  describe("Full Authentication Lifecycle Flow", () => {
    let userId: string;
    let rawCookieToken: string;

    it("1. Register new user profile successfully", async () => {
      const dto: RegisterDto = {
        email: "test_integration@example.com",
        password: "password123Secure",
        name: "Integration Test User",
      };

      const result = await service.register(dto);
      expect(result).toBeDefined();
      expect(result.email).toBe("test_integration@example.com");
      expect(result.role).toBe("USER");
      expect(result.id).toBeDefined();
      userId = result.id;
    });

    it("2. Reject duplicate email registration", async () => {
      const dto: RegisterDto = {
        email: "test_integration@example.com",
        password: "anotherPassword123",
        name: "Duplicate User",
      };

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it("3. Authenticate / Login user and establish session cookie", async () => {
      const dto: LoginDto = {
        email: "test_integration@example.com",
        password: "password123Secure",
      };

      const res = mockResponse();
      const result = await service.login(dto, "Mozilla/5.0", "127.0.0.1", res);

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.user.id).toBe(userId);
      expect(res.cookie).toHaveBeenCalled();

      const mockCalls = (res.cookie as jest.Mock).mock.calls;
      rawCookieToken = mockCalls[0][1];
      expect(rawCookieToken).toBeDefined();
    });

    it("4. Reject login with invalid credentials", async () => {
      const dto: LoginDto = {
        email: "test_integration@example.com",
        password: "wrongPassword",
      };

      const res = mockResponse();
      await expect(
        service.login(dto, "Mozilla/5.0", "127.0.0.1", res),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("5. Perform silent refresh and rotate cookies", async () => {
      const res = mockResponse();
      const result = await service.refresh(
        rawCookieToken,
        "Mozilla/5.0",
        "127.0.0.1",
        res,
      );

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(res.cookie).toHaveBeenCalled();

      const mockCalls = (res.cookie as jest.Mock).mock.calls;
      const newRawToken = mockCalls[0][1];
      expect(newRawToken).toBeDefined();
      expect(newRawToken).not.toBe(rawCookieToken);

      rawCookieToken = newRawToken;
    });

    it("6. Perform logout and invalidate session", async () => {
      const res = mockResponse();
      await service.logout(rawCookieToken, res);
      expect(res.clearCookie).toHaveBeenCalled();

      await expect(
        service.refresh(rawCookieToken, "Mozilla/5.0", "127.0.0.1", res),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
