import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/iam.enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async getSettings(@TenantId() tenantId: number) {
    return this.tenantsService.findOne(tenantId);
  }

  @Patch()
  async updateSettings(@TenantId() tenantId: number, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(tenantId, dto);
  }
}