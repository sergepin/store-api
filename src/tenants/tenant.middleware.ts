import {
  Injectable,
  NestMiddleware,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from './tenants.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly tenantsService: TenantsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host;
    const tenantSlugHeader = req.headers['x-tenant-slug'] as string;

    let tenantSlug: string | undefined;

    // 1. URL/Host Resolution (Highest Priority for Production)
    // If the host is not a generic local address, we trust the domain/subdomain.
    if (host && !this.isGenericHost(host)) {
      // Logic: store-a.com -> store-a, store-b.platform.com -> store-b
      tenantSlug = host.split('.')[0];
    } 
    // 2. Header Resolution (Priority for Dev/Internal testing)
    else if (tenantSlugHeader) {
      tenantSlug = tenantSlugHeader;
    }
    // 3. Fallback for local development
    else {
      tenantSlug = 'gamer-store';
    }

    if (!tenantSlug) {
      throw new NotFoundException('Could not resolve tenant from request');
    }

    try {
      const tenantId = await this.tenantsService.getTenantIdBySlug(tenantSlug);
      
      // Attach to request object
      (req as any).tenantId = tenantId;
      (req as any).tenantSlug = tenantSlug;

      next();
    } catch (error) {
      this.logger.error(`Failed to resolve tenant for slug: ${tenantSlug}`);
      throw new NotFoundException(`Tenant '${tenantSlug}' not found`);
    }
  }

  private isGenericHost(host: string): boolean {
    const genericHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
    return genericHosts.some((gh) => host.includes(gh));
  }
}
