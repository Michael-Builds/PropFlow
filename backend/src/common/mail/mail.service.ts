import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { AppLogger } from '../logger/app-logger.service';

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: Transporter | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  onModuleInit(): void {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    if (!host) {
      this.logger.info('Mail transport: log-only (SMTP_HOST not set)', MailService.name);
      return;
    }

    const port = this.config.get<number>('SMTP_PORT') ?? 587;
    const secure = this.config.get<boolean>('SMTP_SECURE') ?? false;
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS')?.trim();

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    this.logger.success(
      `Mail transport ready → ${host}:${port} (secure=${secure})`,
      MailService.name,
    );
  }

  async send(to: string, subject: string, text: string, html?: string): Promise<void> {
    await this.sendMessage({ to, subject, text, html });
  }

  async sendMessage(message: MailMessage): Promise<void> {
    const from =
      this.config.get<string>('MAIL_FROM')?.trim() || 'PropFlow <noreply@propflow.app>';
    const html = message.html ?? textToHtml(message.text);

    if (!this.transporter) {
      this.logger.info(
        `Mail (log only) to ${message.to}: ${message.subject}\n${message.text}`,
        MailService.name,
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html,
      });
      this.logger.success(
        `Mail sent to ${message.to} · ${message.subject} · id=${info.messageId}`,
        MailService.name,
      );
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Mail failed to ${message.to} · ${message.subject}`,
        stack,
        MailService.name,
      );
      throw error;
    }
  }
}

function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const withLinks = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#0028f2;">$1</a>',
  );
  return `<pre style="font-family:ui-sans-serif,system-ui,sans-serif;white-space:pre-wrap;line-height:1.5;">${withLinks}</pre>`;
}
