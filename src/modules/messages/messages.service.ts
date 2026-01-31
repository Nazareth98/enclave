import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getUserGroups(userId: number) {
    return this.prisma.group.findMany({
      where: { members: { some: { userId } } },
    });
  }

  async savePrivateMessage(senderId: number, receiverNickname: string, content: string) {
    const receiver = await this.prisma.user.findUnique({
      where: { nickname: receiverNickname },
    });

    if (!receiver) throw new Error("Usuário não encontrado");

    return this.prisma.message.create({
      data: {
        content,
        senderId,
        receiverId: receiver.id,
      },
      include: {
        sender: { select: { nickname: true } },
      },
    });
  }

  async saveGroupMessage(senderId: number, groupId: number, content: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: senderId,
          groupId: groupId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException("Você não tem permissão para enviar mensagens neste grupo.");
    }

    return this.prisma.message.create({
      data: {
        content,
        senderId,
        groupId,
      },
      include: {
        sender: { select: { nickname: true } },
      },
    });
  }
}
