import { Body, Controller, Delete, Param, ParseIntPipe, Post, Request, UseGuards } from "@nestjs/common";
import { CreateGroupDto } from "./dtos/create-group.dto";
import { GroupsService } from "./groups.service";
import { AddMembersBulkDto } from "./dtos/add-members-bulk.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { FirstAccessGuard } from "../auth/guards/first-access.guard";
import { RemoveMemberDto } from "./dtos/remove-member.dto";

@Controller("groups")
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @UseGuards(JwtAuthGuard, FirstAccessGuard)
  @Post()
  create(@Body() dto: CreateGroupDto, @Request() req) {
    return this.groupsService.createGroup(dto.name, req.user.userId, dto.membersNicknames);
  }

  @UseGuards(JwtAuthGuard, FirstAccessGuard)
  @Post(":id/members")
  addMembers(@Param("id", ParseIntPipe) groupId: number, @Body() dto: AddMembersBulkDto, @Request() req) {
    return this.groupsService.addMembersToGroup(groupId, dto.nicknames, req.user.userId);
  }

  @Delete(":id/members")
  @UseGuards(JwtAuthGuard, FirstAccessGuard)
  removeMember(@Param("id", ParseIntPipe) groupId: number, @Body() dto: RemoveMemberDto, @Request() req) {
    return this.groupsService.removeMember(groupId, dto.nickname, req.user.userId);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, FirstAccessGuard)
  async deleteGroup(@Param("id", ParseIntPipe) groupId: number, @Request() req) {
    await this.groupsService.deleteGroup(groupId, req.user.userId);
    return { message: "Grupo excluído com sucesso." };
  }
}
