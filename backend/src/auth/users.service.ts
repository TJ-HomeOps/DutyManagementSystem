import { Injectable } from '@nestjs/common';
import type { Employee, User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export const USER_SESSION_COOKIE_NAME = 'duty_user_session';
const USER_SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export interface EntraClaims {
  entraObjectId: string;
  email: string;
  name: string;
}

export type AuthenticatedUser = User & { employee: Employee | null };

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // JIT-provisions a User on every Entra login (never on local-password
  // login, which stays fully anonymous). Re-resolves the Employee link each
  // time in case an admin has since added/changed the matching email.
  async upsertFromEntra(
    claims: EntraClaims,
  ): Promise<{ token: string; expiresAt: Date }> {
    const employee = await this.prisma.employee.findFirst({
      where: { email: { equals: claims.email, mode: 'insensitive' } },
    });

    const user = await this.prisma.user.upsert({
      where: { entraObjectId: claims.entraObjectId },
      create: {
        entraObjectId: claims.entraObjectId,
        email: claims.email,
        name: claims.name,
        employeeId: employee?.id ?? null,
      },
      update: {
        email: claims.email,
        name: claims.name,
        employeeId: employee?.id ?? null,
        lastLoginAt: new Date(),
      },
    });

    const expiresAt = new Date(Date.now() + USER_SESSION_MAX_AGE_MS);

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        expiresAt,
      },
    });

    return { token: session.id, expiresAt };
  }

  async getUserBySessionToken(
    token: string,
  ): Promise<AuthenticatedUser | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: token },
      include: { user: { include: { employee: true } } },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session.user;
  }
}
