import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/iam.enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // ── 🛡️ DEVELOPMENT BYPASS ────────────────────────────────────────────────
    const isDev =
      process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const hasBypassHeader = request.headers['x-dev-bypass'] === 'true';

    if (isDev && hasBypassHeader) {
      this.logger.warn(
        '🛡️ RolesGuard: Development bypass active via x-dev-bypass header',
      );
      return true;
    }

    const { user } = request;

    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
