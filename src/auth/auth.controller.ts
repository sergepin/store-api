import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@TenantId() tenantId: number, @Body() dto: RegisterDto) {
    return this.authService.register(tenantId, dto);
  }

  @Post('login')
  async login(@TenantId() tenantId: number, @Body() dto: LoginDto) {
    // Note: In validateUser we check if the user belongs to this tenantId
    const user = await this.authService.validateUser(tenantId, dto);
    return this.authService.login(user);
  }
}
