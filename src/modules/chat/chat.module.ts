import { Module, Global } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { MessagesModule } from "../messages/messages.module";

@Global()
@Module({
  imports: [MessagesModule],
  providers: [ChatGateway, PrismaService],
  exports: [ChatGateway],
})
export class ChatModule {}
