import { Test } from "@nestjs/testing";
import { AuthService } from "./auth.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { hashPassword, verifyPassword } from "../../common/utils/hash.js";

describe("AuthService & Hashing Unit Tests", () => {
  beforeEach(async () => {
    await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "JWT_SECRET") return "secret";
              return null;
            }),
          },
        },
      ],
    }).compile();
  });

  describe("Password Hashing Utility", () => {
    it("should correctly hash and verify password hashes using Argon2id", async () => {
      const password = "mySecretPassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);

      const matches = await verifyPassword(hash, password);
      expect(matches).toBe(true);

      const wrongMatches = await verifyPassword(hash, "wrongpassword");
      expect(wrongMatches).toBe(false);
    });
  });
});
