import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";

@Injectable()
export class FirstAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user.firstAccess && request.url !== "/auth/change-password") {
      throw new ForbiddenException("Troca de senha obrigatória no primeiro acesso.");
    }

    return true;
  }
}
