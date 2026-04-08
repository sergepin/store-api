import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(tenantId: number, email: string) {
    return this.prisma.user.findFirst({
      where: {
        tenantId,
        email,
      },
    });
  }

  async create(data: {
    tenantId: number;
    email: string;
    passwordHash: string;
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
