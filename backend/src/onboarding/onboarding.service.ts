import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { OnboardingProfileDto } from './dto/onboarding-profile.dto';
import { OnboardingPasswordDto } from './dto/onboarding-password.dto';
import { OnboardingFirstPropertyDto } from './dto/onboarding-first-property.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async status(user: JwtUser) {
    if (user.role === 'platform_admin' || !user.orgId) {
      return {
        required: false,
        canComplete: false,
        onboardingComplete: true,
        mustChangePassword: false,
        steps: { password: true, profile: true, property: true },
        organization: null,
      };
    }

    const org = await this.prisma.organization.findUnique({ where: { id: user.orgId } });
    if (!org) throw new NotFoundException('Organisation not found.');

    const me = await this.prisma.user.findUnique({ where: { id: user.sub } });
    const propertyCount = await this.prisma.property.count({ where: { orgId: org.id } });
    const mustChangePassword = me?.mustChangePassword ?? false;
    const profileReady = Boolean(org.name?.trim() && org.phone?.trim() && org.address?.trim());
    const propertyReady = propertyCount > 0;

    return {
      required: !org.onboardingComplete,
      canComplete: user.role === 'owner',
      onboardingComplete: org.onboardingComplete,
      mustChangePassword,
      steps: {
        password: !mustChangePassword,
        profile: profileReady,
        property: propertyReady,
      },
      organization: {
        id: org.id,
        name: org.name,
        phone: org.phone,
        address: org.address,
        city: org.city,
        country: org.country ?? 'GH',
      },
      propertyCount,
    };
  }

  async setPassword(user: JwtUser, dto: OnboardingPasswordDto) {
    this.assertOrgUser(user);
    const hash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id: user.sub },
      data: { passwordHash: hash, mustChangePassword: false },
    });

    const me = await this.prisma.user.findUnique({ where: { id: user.sub } });
    if (me?.email) {
      const frontend = this.mail.frontendUrl();
      await this.mail.sendTemplate(
        me.email,
        'password-changed',
        'Your PropFlow password was changed',
        {
          preheader: 'Your account password was updated during onboarding.',
          fullName: me.fullName,
          loginUrl: `${frontend}/auth/login`,
        },
        [
          `Hello${me.fullName ? ` ${me.fullName}` : ''},`,
          '',
          'Your PropFlow password was changed during company onboarding.',
          `If this wasn’t you, contact support.`,
        ].join('\n'),
      );
    }

    return this.status(user);
  }

  async saveProfile(user: JwtUser, dto: OnboardingProfileDto) {
    this.assertOwner(user);
    await this.prisma.organization.update({
      where: { id: user.orgId! },
      data: {
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
        country: dto.country?.trim() || 'GH',
      },
    });
    return this.status(user);
  }

  async addFirstProperty(user: JwtUser, dto: OnboardingFirstPropertyDto) {
    this.assertOwner(user);
    const existing = await this.prisma.property.count({ where: { orgId: user.orgId! } });
    if (existing > 0) {
      return this.status(user);
    }
    await this.prisma.property.create({
      data: {
        orgId: user.orgId!,
        name: dto.name.trim(),
        location: dto.location?.trim() || null,
        type: dto.type?.trim() || 'residential',
        status: 'active',
      },
    });
    return this.status(user);
  }

  async complete(user: JwtUser) {
    this.assertOwner(user);
    const current = await this.status(user);
    if (!current.steps.password) {
      throw new BadRequestException('Set a new password before finishing onboarding.');
    }
    if (!current.steps.profile) {
      throw new BadRequestException('Complete your company profile (name, phone, and address).');
    }
    if (!current.steps.property) {
      throw new BadRequestException('Add your first property before finishing onboarding.');
    }

    await this.prisma.organization.update({
      where: { id: user.orgId! },
      data: {
        onboardingComplete: true,
        onboardingCompletedAt: new Date(),
      },
    });

    return this.status(user);
  }

  private assertOrgUser(user: JwtUser) {
    if (user.role === 'platform_admin' || !user.orgId) {
      throw new ForbiddenException('Onboarding is only for company users.');
    }
  }

  private assertOwner(user: JwtUser) {
    this.assertOrgUser(user);
    if (user.role !== 'owner') {
      throw new ForbiddenException('Only the company owner can finish onboarding.');
    }
  }
}
