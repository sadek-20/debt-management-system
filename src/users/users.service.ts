import { Injectable } from '@nestjs/common';
import { Prisma, UserRole, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        phone,
        isDeleted: false,
      },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  createOwner(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data: {
        ...data,
        role: UserRole.OWNER,
        isActive: true,
      },
    });
  }
}
