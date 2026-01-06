import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GroupRole } from "@prisma/client";

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(name: string, ownerId: number, nicknames: string[] = []) {
    const members = await this.prisma.user.findMany({
      where: { nickname: { in: nicknames } },
      select: { id: true },
    });

    const filteredMembers = members.filter((member) => member.id !== ownerId);
    const membersWithRole = filteredMembers.map((member) => ({ userId: member.id, role: GroupRole.MEMBER }));
    const owner = { userId: ownerId, role: GroupRole.ADMIN };

    return this.prisma.group.create({
      data: {
        name: name.trim(),
        created_by: ownerId,
        members: {
          create: [owner, ...membersWithRole],
        },
      },
      include: { members: true },
    });
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

    return this.prisma.groupMember.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });
  }

  async removeMember(groupId: number, targetNickname: string, requesterId: number) {
    const userToRemove = await this.prisma.user.findUnique({
      where: { nickname: targetNickname },
    });

    if (!userToRemove) throw new NotFoundException("Usuário não encontrado.");

    const requester = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: requesterId, groupId } },
    });

    const isSelfRemoving = userToRemove.id === requesterId;

    if (requester?.role !== GroupRole.ADMIN && !isSelfRemoving) {
      throw new ForbiddenException("Você não tem permissão para remover este membro.");
    }

    if (isSelfRemoving && requester?.role === GroupRole.ADMIN) {
      const otherAdmins = await this.prisma.groupMember.count({
        where: { groupId, role: GroupRole.ADMIN, NOT: { userId: requesterId } },
      });
      if (otherAdmins === 0) {
        throw new ForbiddenException("O último administrador não pode sair do grupo.");
      }
    }

    return this.prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId: userToRemove.id,
          groupId: groupId,
        },
      },
    });
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
