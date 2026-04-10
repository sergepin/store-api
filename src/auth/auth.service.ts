import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(tenantId: number, dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(tenantId, dto.email);
    if (existing) {
      throw new ConflictException('Email already registered in this store');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create User + Customer in a transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          email: dto.email,
          passwordHash,
        },
      });

      await tx.customer.create({
        data: {
          tenantId,
          userId: user.id,
          email: dto.email,
          fullName: dto.name,
          customerType: 'individual',
        },
      });

      return this.login(user);
    });
  }

  async validateUser(tenantId: number, dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email },
      include: { memberships: { where: { tenantId } } },
    });

    if (user?.passwordHash) {
      const isMatch = await bcrypt.compare(
        dto.password,
        user.passwordHash as string,
      );

      if (isMatch) {
        // Find membership role for this tenant
        const membership = user.memberships[0];
        const role = membership?.role || 'CUSTOMER';

        const { passwordHash: _passwordHash, memberships: _m, ...result } = user;
        return { ...result, role };
      }
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
