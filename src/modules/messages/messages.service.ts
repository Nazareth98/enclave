import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ChatType, GetMessagesDto } from "./dtos/get-messages.dto";
import { RecentChat } from "src/@types/recent-chat.types";

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getUserGroups(userId: number) {
    return this.prisma.group.findMany({
      where: { members: { some: { userId } } },
    });
  }

  async getRecentChats(userId: number): Promise<RecentChat[]> {
    const groups = await this.prisma.group.findMany({
      where: { members: { some: { userId } } },
      select: {
        id: true,
        name: true,
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { sender: { select: { nickname: true } } },
        },
      },
    });

    const privateMessages = await this.prisma.message.findMany({
      where: {
        groupId: null,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: "desc" },
      distinct: ["senderId", "receiverId"],
    });

    const visitedPartners = new Set();
    const processedMessages: typeof privateMessages = [];

    for (const msg of privateMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;

      if (!visitedPartners.has(partnerId) && partnerId !== null) {
        visitedPartners.add(partnerId);
        processedMessages.push(msg);
      }
    }

    const privateChatsWithDetails: RecentChat[] = await Promise.all(
      processedMessages.map(async (msg) => {
        const partnerId = (msg.senderId === userId ? msg.receiverId : msg.senderId) as number;
        const partner = await this.prisma.user.findUnique({
          where: { id: partnerId },
          select: { id: true, nickname: true },
        });

        return {
          id: partner?.id ?? partnerId,
          name: partner?.nickname ?? "Usuário",
          type: "private" as const,
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            senderNickname: msg.senderId === userId ? "Você" : (partner?.nickname ?? ""),
          },
        };
      }),
    );

    const formattedGroups: RecentChat[] = groups.map((g) => ({
      id: g.id,
      name: g.name,
      type: "group" as const,
      lastMessage: g.messages[0]
        ? {
            content: g.messages[0].content,
            createdAt: g.messages[0].createdAt,
            senderNickname: g.messages[0].sender.nickname,
          }
        : null,
    }));

    const recentChats: RecentChat[] = [];
    for (let i = 0; i < privateChatsWithDetails.length; i++) {
      recentChats.push(privateChatsWithDetails[i]);
    }

    for (let j = 0; j < formattedGroups.length; j++) {
      recentChats.push(formattedGroups[j]);
    }

    return recentChats
      .filter(
        (chat): chat is RecentChat & { lastMessage: { content: string; createdAt: Date; senderNickname: string } } =>
          chat.lastMessage !== null,
      )
      .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
  }

  async getMessages(userId: number, dto: GetMessagesDto) {
    const { targetId, type, limit = 20, cursorId } = dto;

    if (type === ChatType.GROUP) {
      const isMember = await this.prisma.groupMember.findUnique({
        where: {
          userId_groupId: { userId, groupId: targetId },
        },
      });
      if (!isMember) throw new ForbiddenException("Você não pertence a este grupo.");
    }

    let whereClause: any = {};

    if (type === ChatType.PRIVATE) {
      whereClause = {
        OR: [
          { senderId: userId, receiverId: targetId },
          { senderId: targetId, receiverId: userId },
        ],
        groupId: null,
      };
    } else {
      whereClause = {
        groupId: targetId,
      };
    }

    const messages = await this.prisma.message.findMany({
      take: limit,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    return {
      data: messages,
      nextCursor: messages.length === limit ? messages[messages.length - 1].id : null,
    };
  }

  async savePrivateMessage(senderId: number, receiverId: number, content: string) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
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
