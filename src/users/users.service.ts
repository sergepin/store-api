import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(tenantId: number, email: string) {
    return this.prisma.client.user.findFirst({
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
    return this.prisma.client.user.create({
      data,
    });
  }

  async findById(id: number) {
    return this.prisma.client.user.findUnique({
      where: { id },
    });
  }
}
