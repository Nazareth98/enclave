import { Module } from "@nestjs/common";
import { GroupsController } from "./groups.controller";
import { GroupsService } from "./groups.service";
import { ChatModule } from "../chat/chat.module";

@Module({
  controllers: [GroupsController],
  providers: [GroupsService],
  imports: [ChatModule],
})
export class GroupsModule {}
