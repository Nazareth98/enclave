import { Controller, Get, Query, Request, UseGuards } from "@nestjs/common";
import { MessagesService } from "./messages.service";
import { GetMessagesDto } from "./dtos/get-messages.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtPayload } from "src/@types/payload.types";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("messages")
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req: AuthenticatedRequest, @Query() query: GetMessagesDto) {
    console.log();
    return this.messagesService.getMessages(req.user.sub, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get("chats")
  async getRecent(@Request() req: AuthenticatedRequest) {
    return this.messagesService.getRecentChats(req.user.sub);
  }
}
