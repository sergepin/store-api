import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(tenantId: number, email: string) {
    return this.prisma.user.findFirst({
      where: {
        tenantId,
        email,
      },
    });
  }

  create(data: { tenantId: number; email: string; passwordHash: string }) {
    return this.prisma.user.create({
      data,
    });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
