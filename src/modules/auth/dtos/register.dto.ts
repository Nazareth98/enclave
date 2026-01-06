// src/auth/dto/register.dto.ts
import { IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(3)
  nickname: string;
}
