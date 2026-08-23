import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { hashPassword, verifyPassword } from "../../common/utils/hash.js";
import * as crypto from "crypto";
import { Response } from "express";

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshExpiresInDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret =
      this.configService.get<string>("JWT_SECRET") ||
      "default_jwt_secret_must_be_long";
    this.jwtExpiresIn =
      this.configService.get<string>("JWT_EXPIRES_IN") || "15m";
    this.refreshExpiresInDays = 7;
  }

  private hashRefreshToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException("Email address is already in use");
    }

    const hashedPassword = await hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: dto.name,
        passwordHash: hashedPassword,
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async login(
    dto: LoginDto,
    userAgent: string,
    ipAddress: string,
    res: Response,
  ) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordMatches = await verifyPassword(
      user.passwordHash,
      dto.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.createSession(
      user.id,
      user.email,
      user.role,
      userAgent,
      ipAddress,
      res,
    );

    return {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async createSession(
    userId: string,
    email: string,
    role: string,
    userAgent: string,
    ipAddress: string,
    res: Response,
  ) {
    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const hashedToken = this.hashRefreshToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpiresInDays);

    await this.prisma.session.create({
      data: {
        userId,
        hashedRefreshToken: hashedToken,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    const isProduction =
      this.configService.get<string>("NODE_ENV") === "production";
    res.cookie("refreshToken", rawRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: this.refreshExpiresInDays * 24 * 60 * 60 * 1000,
    });

    const accessToken = this.jwtService.sign(
      { email, role },
      {
        subject: userId,
        expiresIn: this.jwtExpiresIn,
        secret: this.jwtSecret,
      },
    );

    return { accessToken };
  }

  async refresh(
    rawRefreshToken: string,
    userAgent: string,
    ipAddress: string,
    res: Response,
  ) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException("Refresh token is missing");
    }

    const hashedToken = this.hashRefreshToken(rawRefreshToken);
    const session = await this.prisma.session.findUnique({
      where: { hashedRefreshToken: hashedToken },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired session");
    }

    if (!session.user.isActive) {
      throw new UnauthorizedException("User is inactive");
    }

    await this.prisma.session.delete({
      where: { id: session.id },
    });

    const tokens = await this.createSession(
      session.user.id,
      session.user.email,
      session.user.role,
      userAgent,
      ipAddress,
      res,
    );

    return { accessToken: tokens.accessToken };
  }

  async logout(rawRefreshToken: string, res: Response) {
    if (rawRefreshToken) {
      const hashedToken = this.hashRefreshToken(rawRefreshToken);
      try {
        await this.prisma.session.delete({
          where: { hashedRefreshToken: hashedToken },
        });
      } catch (err) {
        // Ignore if session not found
      }
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: this.configService.get<string>("NODE_ENV") === "production",
      sameSite: "lax",
    });
  }
}
