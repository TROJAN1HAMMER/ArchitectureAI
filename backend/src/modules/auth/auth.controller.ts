import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User successfully registered" })
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return data;
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login user and establish session" })
  @ApiResponse({ status: 200, description: "Successful login" })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers["user-agent"] || "unknown";
    const ipAddress = req.ip || "unknown";
    const data = await this.authService.login(dto, userAgent, ipAddress, res);
    return data;
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token using refresh cookie" })
  @ApiResponse({ status: 200, description: "Token refreshed successfully" })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    const userAgent = req.headers["user-agent"] || "unknown";
    const ipAddress = req.ip || "unknown";
    const data = await this.authService.refresh(
      refreshToken,
      userAgent,
      ipAddress,
      res,
    );
    return data;
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Revoke active session and clear cookie" })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    await this.authService.logout(refreshToken, res);
    return {};
  }
}
