import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { MailService } from '../common/mail/mail.service';
import type { UserRole } from '../generated/prisma/client';

type TokenClaims = {
  sub: string;
  orgId: string | null;
  role: UserRole;
  email: string;
  tenantId: string | null;
  vendorId: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
    private readonly mail: MailService,
  ) {}

  async login(payload: LoginDto) {
    const user = await this.usersService.findByEmail(payload.email);
    if (!user || user.status !== 'active') {
      this.logger.warning(
        `Failed login for ${payload.email}: user not found`,
        AuthService.name,
      );
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.role !== 'platform_admin' && user.organization?.status === 'suspended') {
      throw new UnauthorizedException('This organisation is suspended.');
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) {
      this.logger.warning(
        `Failed login for ${payload.email}: invalid password`,
        AuthService.name,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.success(
      `User ${user.id} signed in with role ${user.role}`,
      AuthService.name,
    );

    return this.issueSession(user);
  }

  async refresh(refreshToken: string) {
    const claims = await this.verifyRefresh(refreshToken);
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (stored.userId !== claims.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.usersService.findById(claims.sub);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (user.role !== 'platform_admin' && user.organization?.status === 'suspended') {
      throw new UnauthorizedException('This organisation is suspended.');
    }

    return this.issueSession(user);
  }

  async logoutSession(user: { sub?: string } | undefined, refreshToken?: string) {
    try {
      if (user?.sub) {
        return await this.logout(user.sub, refreshToken);
      }
      if (!refreshToken) return { ok: true };
      const claims = await this.verifyRefresh(refreshToken);
      return await this.logout(claims.sub, refreshToken);
    } catch {
      return { ok: true };
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    this.logger.success(`User ${userId} signed out`, AuthService.name);
    return { ok: true };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email.trim().toLowerCase());
    if (user && user.status === 'active') {
      const token = randomBytes(32).toString('hex');
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      const frontend = this.mail.frontendUrl();
      const resetUrl = `${frontend}/auth/reset?token=${token}`;
      await this.mail.sendTemplate(
        user.email,
        'forgot-password',
        'Reset your PropFlow password',
        {
          preheader: 'Use this secure link within one hour to reset your password.',
          fullName: user.fullName,
          resetUrl,
        },
        [
          'Reset your PropFlow password',
          '',
          `Hi${user.fullName ? ` ${user.fullName}` : ''},`,
          'Use this link within one hour to reset your password:',
          resetUrl,
          '',
          'If you did not request this, you can ignore this email.',
        ].join('\n'),
      );
    }
    return { ok: true };
  }

  async resetPassword(token: string, password: string) {
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { email: true, fullName: true } } },
    });
    if (!stored || stored.usedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash: await bcrypt.hash(password, 10) },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    const loginUrl = `${this.mail.frontendUrl()}/auth/login`;
    try {
      await this.mail.sendTemplate(
        stored.user.email,
        'password-changed',
        'Your PropFlow password was updated',
        {
          preheader: 'Your password was changed successfully.',
          fullName: stored.user.fullName,
          loginUrl,
        },
        [
          'Your PropFlow password was updated.',
          '',
          `Sign in at ${loginUrl}`,
          '',
          'If you did not make this change, contact support immediately.',
        ].join('\n'),
      );
    } catch {
      // Password already changed — do not fail the request on mail errors.
    }

    return { ok: true };
  }

  private async issueSession(user: {
    id: string;
    orgId: string | null;
    role: UserRole;
    email: string;
    fullName?: string | null;
    tenantId: string | null;
    vendorId: string | null;
    mustChangePassword?: boolean;
    organization?: {
      name: string;
      onboardingComplete: boolean;
      status?: string;
    } | null;
  }) {
    const claims: TokenClaims = {
      sub: user.id,
      orgId: user.orgId,
      role: user.role,
      email: user.email,
      tenantId: user.tenantId,
      vendorId: user.vendorId,
    };

    const accessTtl = this.configService.getOrThrow<number>('JWT_ACCESS_TTL');
    const refreshTtl = this.configService.getOrThrow<number>('JWT_REFRESH_TTL');

    const accessToken = await this.jwtService.signAsync(claims, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTtl,
    });
    const refreshToken = await this.jwtService.signAsync(claims, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshTtl,
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTtl,
      user: {
        id: user.id,
        role: user.role,
        orgId: user.orgId,
        email: user.email,
        fullName: user.fullName ?? null,
        tenantId: user.tenantId,
        vendorId: user.vendorId,
        mustChangePassword: user.mustChangePassword ?? false,
        onboardingComplete:
          user.role === 'platform_admin'
            ? true
            : (user.organization?.onboardingComplete ?? true),
        orgName: user.organization?.name ?? null,
      },
    };
  }

  private async verifyRefresh(token: string): Promise<TokenClaims> {
    try {
      return await this.jwtService.verifyAsync<TokenClaims>(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
