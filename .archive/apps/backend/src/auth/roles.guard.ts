import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, AppRole } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { ['cognito:groups']?: string[] } }>();
    const user = request.user;
    const groups = (user?.['cognito:groups'] ?? []).map((group) =>
      group
        .toString()
        .toLowerCase()
        .replace(/[\s_-]/g, ''),
    );
    const normalizedRequired = required.map((role) =>
      role.toLowerCase().replace(/[\s_-]/g, ''),
    );

    const hasRole = normalizedRequired.some((role) => groups.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
