// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request, Patch } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dtos/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LoginDto } from "./dtos/login.dto";
import { ChangePasswordDto } from "./dtos/change-password.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.nickname);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.nickname, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("change-password")
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, dto);
  }

  // Chamar u guard de firsAccess para as rotas que precisam NAO ESQUECER!
}
