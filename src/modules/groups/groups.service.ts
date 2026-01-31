import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GroupRole } from "@prisma/client";
import { ChatGateway } from "../chat/chat.gateway";

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
  ) {}

  async createGroup(name: string, ownerId: number, nicknames: string[] = []) {
    // 1. Busca IDs dos nicknames (exceto o dono que já será ADMIN)
    const members = await this.prisma.user.findMany({
      where: { nickname: { in: nicknames }, NOT: { id: ownerId } },
      select: { id: true },
    });

    const membersWithRole = members.map((m) => ({ userId: m.id, role: GroupRole.MEMBER }));
    const owner = { userId: ownerId, role: GroupRole.ADMIN };

    const newGroup = await this.prisma.group.create({
      data: {
        name: name.trim(),
        created_by: ownerId,
        members: {
          create: [owner, ...membersWithRole],
        },
      },
      include: { members: true },
    });

    newGroup.members.forEach((member) => {
      this.chatGateway.server.to(`user_${member.userId}`).emit("added_to_group", {
        groupId: newGroup.id,
        name: newGroup.name,
        role: member.role,
      });
    });

    return newGroup;
  }

  async addMembersToGroup(groupId: number, nicknames: string[], requesterId: number) {
    const requester = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: requesterId, groupId } },
    });

    if (!requester || requester.role !== GroupRole.ADMIN) {
      throw new ForbiddenException("Apenas administradores podem gerenciar membros.");
    }

    const usersToAdd = await this.prisma.user.findMany({
      where: { nickname: { in: nicknames } },
    });

    if (usersToAdd.length === 0) throw new NotFoundException("Nenhum usuário encontrado.");

    const dataToInsert = usersToAdd.map((user) => ({
      userId: user.id,
      groupId: groupId,
      role: GroupRole.MEMBER,
    }));

    await this.prisma.groupMember.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });

    usersToAdd.forEach((user) => {
      this.chatGateway.server.to(`user_${user.id}`).emit("added_to_group", {
        groupId,
        role: GroupRole.MEMBER,
      });
    });

    return { success: true, count: usersToAdd.length };
  }

  async removeMember(groupId: number, targetNickname: string, requesterId: number) {
    const userToRemove = await this.prisma.user.findUnique({
      where: { nickname: targetNickname },
    });

    if (!userToRemove) throw new NotFoundException("Usuário não encontrado.");

    const membership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: userToRemove.id, groupId } },
    });

    if (!membership) throw new NotFoundException("Usuário não pertence ao grupo.");

    const requester = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: requesterId, groupId } },
    });

    const isSelfRemoving = userToRemove.id === requesterId;

    if (requester?.role !== GroupRole.ADMIN && !isSelfRemoving) {
      throw new ForbiddenException("Permissão negada.");
    }

    if (isSelfRemoving && requester?.role === GroupRole.ADMIN) {
      const otherAdmins = await this.prisma.groupMember.count({
        where: { groupId, role: GroupRole.ADMIN, NOT: { userId: requesterId } },
      });
      if (otherAdmins === 0) {
        throw new ForbiddenException("O último administrador não pode sair sem nomear outro.");
      }
    }

    await this.prisma.groupMember.delete({
      where: { userId_groupId: { userId: userToRemove.id, groupId } },
    });

    this.chatGateway.server.to(`user_${userToRemove.id}`).emit("removed_from_group", { groupId });

    return { message: "Removido com sucesso" };
  }

  async deleteGroup(groupId: number, requesterId: number) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: requesterId,
          groupId: groupId,
        },
      },
    });

    if (!membership || membership.role !== GroupRole.ADMIN) {
      throw new ForbiddenException("Apenas administradores podem excluir o grupo.");
    }

    return this.prisma.group.delete({
      where: { id: groupId },
    });
  }
}
