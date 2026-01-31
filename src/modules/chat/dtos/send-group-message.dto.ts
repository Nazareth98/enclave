import { IsString, IsInt, MinLength } from "class-validator";

export class SendGroupMessageDto {
  @IsString()
  @MinLength(1)
  content: string;

  @IsInt()
  groupId: number;
}
