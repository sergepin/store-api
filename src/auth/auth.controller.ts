import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { TenantsService } from '../tenants/tenants.service.js';

const DEV_TENANT_SLUG = 'gamer-store';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const tenantId =
      await this.tenantsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    return this.authService.register(tenantId, dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const tenantId =
      await this.tenantsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    // Note: In validateUser we check if the user belongs to this tenantId
    const user = await this.authService.validateUser(tenantId, dto);
    return this.authService.login(user);
  }
}
