import { Module } from "@nestjs/common";
import { MessagesService } from "./messages.service";
import { PrismaModule } from "../prisma/prisma.module";
import { MessagesController } from "./messages.controller";

@Module({
  imports: [PrismaModule],
  providers: [MessagesService],
  exports: [MessagesService],
  controllers: [MessagesController],
})
export class MessagesModule {}
