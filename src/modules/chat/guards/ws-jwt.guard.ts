import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { JwtPayload } from "src/@types/payload.types";

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log("ta chegando aquioi");
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();

      const authToken = client.handshake.auth?.token || client.handshake.headers?.authorization;

      if (!authToken) throw new WsException("Token não encontrado");

      const token = authToken.split(" ")[1];
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      client.handshake.auth.user = payload;

      return true;
    } catch (err) {
      throw new WsException("Não autorizado");
    }
  }
}
