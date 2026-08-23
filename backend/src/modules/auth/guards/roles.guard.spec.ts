import { Test, TestingModule } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import { ExecutionContext } from "@nestjs/common";
import { RolesGuard } from "./roles.guard.js";
import { Role } from "@prisma/client";

describe("RolesGuard Unit Tests", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it("should allow access if no roles are required", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should deny access if user has different role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: Role.USER },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(false);
  });

  it("should allow access if user has required role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: Role.ADMIN },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });
});
