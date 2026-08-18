import { Injectable, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '../common/logger/app-logger.service';

type PaystackInitResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at?: string;
    channel?: string;
    fees?: number;
    customer?: { email?: string };
    metadata?: Record<string, unknown>;
  };
};

@Injectable()
export class PaystackService {
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  async initialize(params: {
    email: string;
    amountPesewas: number;
    reference: string;
    currency: string;
    callbackUrl: string;
    channels: string[];
    metadata: Record<string, unknown>;
  }) {
    const payload = await this.request<PaystackInitResponse>('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email: params.email,
        amount: params.amountPesewas,
        reference: params.reference,
        currency: params.currency,
        callback_url: params.callbackUrl,
        channels: params.channels,
        metadata: params.metadata,
      }),
    });
    if (!payload.status || !payload.data) {
      throw new BadGatewayException(payload.message || 'Paystack initialize failed.');
    }
    return payload.data;
  }

  async verify(reference: string) {
    const payload = await this.request<PaystackVerifyResponse>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      { method: 'GET' },
    );
    if (!payload.status || !payload.data) {
      throw new BadGatewayException(payload.message || 'Paystack verify failed.');
    }
    return payload.data;
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const secret = this.config.getOrThrow<string>('PAYSTACK_SECRET_KEY');
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    const body = (await response.json()) as T & { message?: string };
    if (!response.ok) {
      this.logger.warning(`Paystack ${path} failed: ${body.message ?? response.status}`, PaystackService.name);
      throw new BadGatewayException(body.message || 'Paystack request failed.');
    }
    return body;
  }
}
