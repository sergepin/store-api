import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/iam.enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('tenant/config')
  async getPublicConfig(@TenantId() tenantId: number) {
    const tenant = await this.tenantsService.findOne(tenantId);
    // Return only public fields
    return {
      name: tenant.name,
      slug: tenant.slug,
      defaultCurrency: tenant.defaultCurrency,
      settings: tenant.settings,
    };
  }

  @Get('admin/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getSettings(@TenantId() tenantId: number) {
    return this.tenantsService.findOne(tenantId);
  }

  @Patch('admin/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateSettings(
    @TenantId() tenantId: number,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(tenantId, dto);
  }
}
