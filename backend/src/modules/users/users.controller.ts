import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { UsersService } from "./users.service.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";

@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current logged-in user profile" })
  @ApiResponse({ status: 200, description: "Profile returned successfully" })
  async getMe(@CurrentUser("id") userId: string) {
    return this.usersService.findById(userId);
  }

  @Get("dashboard")
  @ApiOperation({ summary: "Get aggregated dashboard statistics" })
  @ApiResponse({
    status: 200,
    description: "Dashboard stats returned successfully",
  })
  async getDashboard(@CurrentUser("id") userId: string) {
    return this.usersService.getDashboardStats(userId);
  }
}
