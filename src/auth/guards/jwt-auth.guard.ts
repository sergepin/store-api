import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // ── 🛡️ DEVELOPMENT BYPASS ────────────────────────────────────────────────
    const isDev =
      process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const hasBypassHeader = request.headers['x-dev-bypass'] === 'true';

    if (isDev && hasBypassHeader) {
      this.logger.warn(
        '🛡️ JwtAuthGuard: Development bypass active via x-dev-bypass header',
      );
      // In bypass mode, we inject a mock admin user to avoid errors in subsequent logic
      request.user = {
        userId: 0,
        email: 'dev-bypass@store.com',
        role: 'ADMIN',
        tenantId: request.tenantId, // Resolved by TenantMiddleware
      };
      return true;
    }

    return super.canActivate(context);
  }
}
