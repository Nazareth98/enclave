import { IsEnum, IsInt, IsOptional, Max } from "class-validator";
import { Type } from "class-transformer";

export enum ChatType {
  PRIVATE = "private",
  GROUP = "group",
}

export class GetMessagesDto {
  @IsEnum(ChatType)
  type: ChatType;

  @Type(() => Number)
  @IsInt()
  targetId: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Max(100)
  limit?: number = 20;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  cursorId?: number;
}
