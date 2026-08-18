import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '../logger/app-logger.service';

@Injectable()
export class MailService {
  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  async send(to: string, subject: string, text: string): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    if (!host) {
      this.logger.info(`Mail (log only) to ${to}: ${subject}\n${text}`, MailService.name);
      return;
    }
    this.logger.info(
      `SMTP is configured at ${host} but outbound transport is log-only in this build. To ${to}: ${subject}`,
      MailService.name,
    );
    this.logger.info(text, MailService.name);
  }
}
