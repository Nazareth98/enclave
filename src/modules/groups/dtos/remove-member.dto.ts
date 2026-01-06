import { IsString } from "class-validator";

export class RemoveMemberDto {
  @IsString()
  nickname: string;
}
