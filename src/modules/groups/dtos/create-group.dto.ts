import { IsString, IsArray, IsOptional, MinLength } from "class-validator";

export class CreateGroupDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  membersNicknames?: string[];
}
