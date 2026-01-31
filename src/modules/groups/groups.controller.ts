import { Body, Controller, Delete, Param, ParseIntPipe, Post, Request, UseGuards } from "@nestjs/common";
import { CreateGroupDto } from "./dtos/create-group.dto";
import { GroupsService } from "./groups.service";
import { AddMembersBulkDto } from "./dtos/add-members-bulk.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { FirstAccessGuard } from "../auth/guards/first-access.guard";
import { RemoveMemberDto } from "./dtos/remove-member.dto";
import { JwtPayload } from "src/@types/payload.types";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("groups")
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @UseGuards(JwtAuthGuard, FirstAccessGuard)
  @Post()
  create(@Body() dto: CreateGroupDto, @Request() req: AuthenticatedRequest) {
    return this.groupsService.createGroup(dto.name, req.user.sub, dto.membersNicknames);
  }

  @UseGuards(JwtAuthGuard, FirstAccessGuard)
  @Post(":id/members")
  addMembers(
    @Param("id", ParseIntPipe) groupId: number,
    @Body() dto: AddMembersBulkDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.addMembersToGroup(groupId, dto.nicknames, req.user.sub);
  }

  @Delete(":id/members")
  @UseGuards(JwtAuthGuard, FirstAccessGuard)
  removeMember(
    @Param("id", ParseIntPipe) groupId: number,
    @Body() dto: RemoveMemberDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.removeMember(groupId, dto.nickname, req.user.sub);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, FirstAccessGuard)
  async deleteGroup(@Param("id", ParseIntPipe) groupId: number, @Request() req: AuthenticatedRequest) {
    await this.groupsService.deleteGroup(groupId, req.user.sub);
    return { message: "Grupo excluído com sucesso." };
  }
}
