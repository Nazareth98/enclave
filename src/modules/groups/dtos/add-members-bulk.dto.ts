import { IsArray, IsString } from "class-validator";

export class AddMembersBulkDto {
  @IsArray()
  @IsString({ each: true })
  nicknames: string[];
}
