import { IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsString()
  @MinLength(3)
  nickname: string;

  @IsString()
  @MinLength(8)
  password: string;
}
