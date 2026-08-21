import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ejs from 'ejs';
import nodemailer, { type Transporter } from 'nodemailer';
import { AppLogger } from '../logger/app-logger.service';

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type MailTemplateName =
  | 'forgot-password'
  | 'password-changed'
  | 'user-invite'
  | 'notification';

const LOGO_CID = 'propflow-logo';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: Transporter | null = null;
  private readonly templatesDir = join(__dirname, 'templates');
  private readonly logoPath = join(process.cwd(), 'assets', 'logo.png');
  private emailCss = '';

  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  onModuleInit(): void {
    const cssPath = join(this.templatesDir, 'styles', 'email.css');
    if (existsSync(cssPath)) {
      this.emailCss = readFileSync(cssPath, 'utf8');
    } else {
      this.logger.warning(`Mail stylesheet missing at ${cssPath}`, MailService.name);
    }

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

    if (!existsSync(this.logoPath)) {
      this.logger.warning(`Mail logo missing at ${this.logoPath}`, MailService.name);
    }
  }

  frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL')?.replace(/\/$/, '') || 'http://localhost:4200';
  }

  supportEmail(): string {
    const from = this.config.get<string>('MAIL_FROM')?.trim() || '';
    const match = from.match(/<([^>]+)>/);
    return match?.[1] || 'support@propflow.app';
  }

  async send(to: string, subject: string, text: string, html?: string): Promise<void> {
    await this.sendMessage({ to, subject, text, html });
  }

  async sendTemplate(
    to: string,
    template: MailTemplateName,
    subject: string,
    data: Record<string, unknown>,
    text: string,
  ): Promise<void> {
    const html = await this.renderTemplate(template, { subject, ...data });
    await this.sendMessage({ to, subject, text, html });
  }

  async sendMessage(message: MailMessage): Promise<void> {
    const from =
      this.config.get<string>('MAIL_FROM')?.trim() || 'PropFlow <noreply@propflow.app>';
    const html = message.html ?? textToHtml(message.text);
    const attachments = existsSync(this.logoPath)
      ? [
          {
            filename: 'logo.png',
            path: this.logoPath,
            cid: LOGO_CID,
            contentDisposition: 'inline' as const,
          },
        ]
      : undefined;

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
        attachments,
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

  private async renderTemplate(
    template: MailTemplateName,
    data: Record<string, unknown>,
  ): Promise<string> {
    const file = join(this.templatesDir, `${template}.ejs`);
    return ejs.renderFile(file, {
      logoCid: LOGO_CID,
      year: new Date().getFullYear(),
      frontendUrl: this.frontendUrl(),
      supportEmail: this.supportEmail(),
      preheader: String(data.preheader ?? data.subject ?? ''),
      emailCss: this.emailCss,
      ...data,
    });
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
    '<a class="email-link" href="$1">$1</a>',
  );
  return `<div class="email-fallback">${withLinks.replace(/\n/g, '<br />')}</div>`;
}
