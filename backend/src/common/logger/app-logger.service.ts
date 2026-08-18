import { Injectable, LoggerService } from '@nestjs/common';
import * as colors from 'colors/safe';

type LogLevel = 'error' | 'warning' | 'success' | 'info' | 'debug';

const LEVEL_LABEL: Record<LogLevel, string> = {
  error: 'ERROR',
  warning: 'WARNING',
  success: 'SUCCESS',
  info: 'INFO',
  debug: 'DEBUG',
};

@Injectable()
export class AppLogger implements LoggerService {
  error(message: unknown, ...optionalParams: unknown[]): void {
    const { context, stack } = this.parseErrorParams(optionalParams);
    this.write('error', message, context);
    if (stack) {
      console.error(colors.red(stack));
    }
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warning', message, this.contextFrom(optionalParams));
  }

  warning(message: unknown, context?: string): void {
    this.write('warning', message, context);
  }

  success(message: unknown, context?: string): void {
    this.write('success', message, context);
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('info', message, this.contextFrom(optionalParams));
  }

  info(message: unknown, context?: string): void {
    this.write('info', message, context);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    this.write('debug', message, this.contextFrom(optionalParams));
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.debug(message, ...optionalParams);
  }

  private write(level: LogLevel, message: unknown, context?: string): void {
    const timestamp = colors.gray(new Date().toISOString());
    const label = this.colorizeLevel(level);
    const scope = context ? colors.magenta(`[${context}]`) : '';
    const line = [timestamp, label, scope, this.stringify(message)]
      .filter(Boolean)
      .join(' ');

    if (level === 'error') {
      console.error(line);
      return;
    }

    console.log(line);
  }

  private colorizeLevel(level: LogLevel): string {
    const padded = LEVEL_LABEL[level].padEnd(7);
    switch (level) {
      case 'error':
        return colors.bold(colors.red(padded));
      case 'warning':
        return colors.bold(colors.yellow(padded));
      case 'success':
        return colors.bold(colors.green(padded));
      case 'info':
        return colors.bold(colors.cyan(padded));
      case 'debug':
        return colors.gray(padded);
    }
  }

  private stringify(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    if (message instanceof Error) {
      return message.message;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  private contextFrom(optionalParams: unknown[]): string | undefined {
    const last = optionalParams[optionalParams.length - 1];
    return typeof last === 'string' ? last : undefined;
  }

  private parseErrorParams(optionalParams: unknown[]): {
    context?: string;
    stack?: string;
  } {
    if (optionalParams.length === 0) {
      return {};
    }

    if (optionalParams.length === 1) {
      const value = optionalParams[0];
      if (typeof value !== 'string') {
        return {};
      }
      return this.looksLikeStack(value)
        ? { stack: value }
        : { context: value };
    }

    const [second, third] = optionalParams;
    return {
      stack: typeof second === 'string' ? second : undefined,
      context: typeof third === 'string' ? third : undefined,
    };
  }

  private looksLikeStack(value: string): boolean {
    return value.includes('\n') || value.startsWith('Error');
  }
}
