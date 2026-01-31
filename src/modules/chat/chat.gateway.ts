import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UseGuards } from "@nestjs/common";
import { WsJwtGuard } from "./guards/ws-jwt.guard";
import { MessagesService } from "../messages/messages.service";
import { JwtPayload } from "src/@types/payload.types";
import { JwtService } from "@nestjs/jwt";

@UseGuards(WsJwtGuard)
@WebSocketGateway({
  cors: { origin: "*" },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private jwtService: JwtService,
  ) {}

  private userSockets = new Map<number, string>();

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization;
      if (!authHeader) return client.disconnect();

      const token = authHeader.split(" ")[1];
      const payload = await this.jwtService.verifyAsync(token);

      const userId = payload.sub;

      client.handshake.auth.user = payload;

      client.join(`user_${userId}`);
      this.userSockets.set(userId, client.id);

      const userGroups = await this.messagesService.getUserGroups(userId);
      userGroups.forEach((group) => client.join(`group_${group.id}`));

      console.log(`✅ User ${userId} conectado e autenticado!`);
    } catch (e) {
      console.log("❌ Erro na autenticação da conexão:", e.message);
      client.disconnect();
    }
  }
  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }
  @SubscribeMessage("send_private_message")
  async handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverNickname: string; encryptedContent: string },
  ) {
    const user: JwtPayload = client.handshake.auth.user;
    const senderId = user.sub;

    const message = await this.messagesService.savePrivateMessage(
      senderId,
      data.receiverNickname,
      data.encryptedContent,
    );

    const receiverId = message.receiverId || message.groupId;

    if (!receiverId) {
      return;
    }

    const receiverSocketId = this.userSockets.get(receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit("new_private_message", message);
    }

    client.emit("new_private_message", message);
  }

  @SubscribeMessage("send_group_message")
  async handleGroupMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: number; encryptedContent: string },
  ) {
    const user: JwtPayload = client.handshake.auth.user;
    const senderId = user.sub;

    try {
      const message = await this.messagesService.saveGroupMessage(senderId, data.groupId, data.encryptedContent);

      this.server.to(`group_${data.groupId}`).emit("new_group_message", message);
    } catch (error) {
      client.emit("error", { message: error.message });
    }
  }
}
