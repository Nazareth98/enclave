import { IsString } from "class-validator";

export class SendPrivateMessageDto {
  @IsString()
  content: string;

  @IsString()
  receiverNickname: string;
}
