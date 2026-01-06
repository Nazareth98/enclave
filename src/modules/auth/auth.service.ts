import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { ChangePasswordDto } from "./dtos/change-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(nickname: string) {
    const existing = await this.prisma.user.findUnique({ where: { nickname } });
    if (existing) throw new ConflictException("Nickname já está em uso");

    const tempPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        nickname: nickname.trim(),
        password: hashedPassword,
        isFirstAccess: true,
      },
    });

    return {
      id: user.id,
      nickname: user.nickname,
      role: user.role,
      temporaryPassword: tempPassword,
    };
  }

  async login(nickname: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { nickname: nickname.trim() } });
    if (!user) throw new UnauthorizedException("Credenciais inválidas");

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException("Credenciais inválidas");

    const payload = { sub: user.id, nickname: user.nickname, firstAccess: user.isFirstAccess, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isFirstAccess: false,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("Credenciais inválidas");

    const payload = { sub: user.id, nickname: user.nickname, firstAccess: false };

    return {
      message: "Senha atualizada com sucesso!",
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
