import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { grossUpForCustomerFees, invoiceStatus, toNumber } from '../common/money';
import { PaystackService } from './paystack.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { InvoicesService } from '../invoices/invoices.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
    private readonly invoices: InvoicesService,
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  async checkout(dto: CreateCheckoutDto, user?: JwtUser) {
    if (!dto.invoiceId && !dto.token) {
      throw new BadRequestException('Provide invoiceId or checkout token.');
    }

    const invoice = dto.token
      ? await this.prisma.invoice.findUnique({ where: { checkoutToken: dto.token } })
      : await this.prisma.invoice.findFirst({
          where: { id: dto.invoiceId, ...(user?.orgId ? { orgId: user.orgId } : {}) },
        });

    if (!invoice) throw new NotFoundException('Invoice not found.');
    if (dto.invoiceId && !user) {
      throw new UnauthorizedException('Sign in to check out with an invoice id.');
    }

    const balance = toNumber(invoice.balance);
    if (balance <= 0) throw new BadRequestException('This invoice is already settled.');

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: invoice.tenantId, orgId: invoice.orgId },
    });
    const email = tenant?.email?.trim();
    if (!email) {
      throw new BadRequestException('Tenant email is required before Paystack checkout.');
    }

    const fees = this.feeQuote(balance);
    const reference = this.newReference();
    const currency = this.config.get<string>('PAYSTACK_CURRENCY') ?? 'GHS';
    const callbackUrl =
      this.config.get<string>('PAYSTACK_CALLBACK_URL') ||
      `${this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4200'}/payments/callback`;
    const channels = String(this.config.get('PAYSTACK_CHANNELS') ?? 'card,mobile_money,bank_transfer')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    await this.prisma.payment.updateMany({
      where: { invoiceId: invoice.id, status: 'pending' },
      data: { status: 'abandoned' },
    });

    const payment = await this.prisma.payment.create({
      data: {
        orgId: invoice.orgId,
        invoiceId: invoice.id,
        amount: fees.netAmount,
        feeAmount: fees.feeAmount,
        chargedAmount: fees.chargedAmount,
        currency,
        method: 'paystack',
        provider: 'paystack',
        direction: 'in',
        status: 'pending',
        reference,
        createdBy: user?.sub,
        metadataJson: {
          invoiceId: invoice.id,
          checkoutToken: invoice.checkoutToken,
          netAmount: fees.netAmount,
          feeAmount: fees.feeAmount,
        },
      },
    });

    try {
      const initialized = await this.paystack.initialize({
        email,
        amountPesewas: fees.chargedPesewas,
        reference,
        currency,
        callbackUrl,
        channels,
        metadata: {
          invoiceId: invoice.id,
          orgId: invoice.orgId,
          paymentId: payment.id,
          checkoutToken: invoice.checkoutToken,
          netAmount: fees.netAmount,
          feeAmount: fees.feeAmount,
          custom_fields: [
            { display_name: 'Invoice', variable_name: 'invoice_id', value: invoice.id },
            {
              display_name: 'Gateway fee (customer)',
              variable_name: 'fee_amount',
              value: `${currency} ${fees.feeAmount.toFixed(2)}`,
            },
          ],
        },
      });

      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          checkoutUrl: initialized.authorization_url,
          accessCode: initialized.access_code,
          providerRef: initialized.reference,
        },
      });

      this.logger.success(
        `Paystack checkout ${updated.reference} for invoice ${invoice.id} (charged ${fees.chargedAmount} incl. ${fees.feeAmount} fee)`,
        PaymentsService.name,
      );

      return {
        ...this.present(updated),
        publicKey: this.config.getOrThrow<string>('PAYSTACK_PUBLIC_KEY'),
        authorizationUrl: initialized.authorization_url,
        accessCode: initialized.access_code,
        invoice: this.invoices.present(invoice),
      };
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  async postManual(orgId: string, userId: string, dto: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: dto.invoiceId, orgId } });
    if (!invoice) throw new NotFoundException('Invoice not found.');
    const balance = toNumber(invoice.balance);
    if (balance <= 0) throw new BadRequestException('This invoice is already settled.');
    if (dto.amount > balance) {
      throw new BadRequestException('Amount cannot exceed the outstanding balance.');
    }

    const reference = dto.reference?.trim() || this.newReference();
    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orgId,
          invoiceId: invoice.id,
          amount: dto.amount,
          feeAmount: 0,
          chargedAmount: dto.amount,
          currency: invoice.currency,
          method: dto.method,
          provider: 'manual',
          direction: 'in',
          status: 'success',
          reference,
          paidAt,
          createdBy: userId,
        },
      });

      const amountPaid = toNumber(invoice.amountPaid) + dto.amount;
      const nextBalance = Math.max(0, toNumber(invoice.amountDue) - amountPaid);
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid,
          balance: nextBalance,
          status: invoiceStatus(nextBalance, amountPaid, invoice.dueDate),
        },
      });

      this.logger.success(
        `Manual payment ${payment.reference} posted on invoice ${invoice.id}`,
        PaymentsService.name,
      );
      return this.present(payment);
    });
  }

  feeQuote(netGhs: number) {
    const percent = this.config.get<number>('PAYSTACK_FEE_PERCENT') ?? 1.95;
    const flat = this.config.get<number>('PAYSTACK_FEE_FLAT') ?? 0;
    const capRaw = this.config.get<number | null>('PAYSTACK_FEE_CAP');
    const cap = capRaw == null || Number.isNaN(Number(capRaw)) ? null : Number(capRaw);
    return grossUpForCustomerFees(netGhs, percent, flat, cap);
  }

  async list(orgId: string, query: ListPaymentsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const where: Prisma.PaymentWhereInput = {
      orgId,
      ...(query.invoiceId ? { invoiceId: query.invoiceId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.direction ? { direction: query.direction } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => this.present(row)),
    };
  }

  async ledger(orgId: string) {
    const rows = await this.prisma.payment.findMany({
      where: { orgId, status: 'success' },
      orderBy: { paidAt: 'desc' },
    });
    const items = rows.map((row) => this.present(row));
    const inflow = items.filter((row) => row.direction === 'in').reduce((sum, row) => sum + row.amount, 0);
    const outflow = items.filter((row) => row.direction === 'out').reduce((sum, row) => sum + row.amount, 0);
    const feesPaidByCustomers = items
      .filter((row) => row.direction === 'in')
      .reduce((sum, row) => sum + row.feeAmount, 0);
    const chargedToCustomers = items
      .filter((row) => row.direction === 'in')
      .reduce((sum, row) => sum + row.chargedAmount, 0);

    return {
      currency: this.config.get<string>('PAYSTACK_CURRENCY') ?? 'GHS',
      inflow,
      outflow,
      net: inflow - outflow,
      feesPaidByCustomers,
      chargedToCustomers,
      count: items.length,
      items,
    };
  }

  async verify(reference: string, orgId?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { reference, ...(orgId ? { orgId } : {}) },
    });
    if (!payment) throw new NotFoundException('Payment not found.');
    if (payment.status === 'success') return this.present(payment);

    const verified = await this.paystack.verify(reference);
    if (verified.status === 'success') {
      return this.settleSuccessfulPayment(payment.reference, verified);
    }

    const status = verified.status === 'failed' ? 'failed' : payment.status;
    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status, providerRef: verified.reference },
    });
    return this.present(updated);
  }

  verifySignature(rawBody: Buffer, signature?: string): boolean {
    if (!signature) return false;
    const secret = this.config.getOrThrow<string>('PAYSTACK_SECRET_KEY');
    const digest = createHmac('sha512', secret).update(rawBody).digest('hex');
    const expected = Buffer.from(digest);
    const received = Buffer.from(signature);
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  }

  async handleWebhook(rawBody: Buffer, signature?: string) {
    if (!this.verifySignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid Paystack signature.');
    }

    const event = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      data?: { reference?: string; status?: string };
    };

    if (event.event !== 'charge.success' || !event.data?.reference) {
      return { received: true };
    }

    await this.settleSuccessfulPayment(event.data.reference);
    return { received: true };
  }

  private async settleSuccessfulPayment(
    reference: string,
    verified?: Awaited<ReturnType<PaystackService['verify']>>,
  ) {
    const verifiedTx = verified ?? (await this.paystack.verify(reference));
    if (verifiedTx.status !== 'success') {
      throw new BadRequestException('Paystack transaction is not successful.');
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { reference } });
      if (!payment) throw new NotFoundException('Payment not found.');
      if (payment.status === 'success') return this.present(payment);

      const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
      if (!invoice) throw new NotFoundException('Invoice not found.');

      const applied = toNumber(payment.amount);
      const amountPaid = toNumber(invoice.amountPaid) + applied;
      const balance = Math.max(0, toNumber(invoice.amountDue) - amountPaid);
      const paidAt = verifiedTx.paid_at ? new Date(verifiedTx.paid_at) : new Date();

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'success',
          providerRef: verifiedTx.reference,
          method: verifiedTx.channel ? `paystack_${verifiedTx.channel}` : 'paystack',
          paidAt,
          metadataJson: {
            ...((payment.metadataJson as Record<string, unknown> | null) ?? {}),
            paystack: {
              amount: verifiedTx.amount,
              fees: verifiedTx.fees,
              channel: verifiedTx.channel,
              currency: verifiedTx.currency,
            },
          },
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid,
          balance,
          status: invoiceStatus(balance, amountPaid, invoice.dueDate),
        },
      });

      this.logger.success(
        `Payment ${payment.reference} settled ${applied} on invoice ${invoice.id}`,
        PaymentsService.name,
      );

      const settled = await tx.payment.findUnique({ where: { id: payment.id } });
      return this.present(settled!);
    });
  }

  private newReference(): string {
    return `pf_${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  }

  async receipt(orgId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, orgId, status: 'success' },
      include: { invoice: { include: { tenant: { select: { fullName: true, email: true } } } } },
    });
    if (!payment) throw new NotFoundException('Payment receipt not found.');
    const amount = toNumber(payment.amount);
    const lines = [
      'PropFlow payment receipt',
      '------------------------',
      `Receipt: ${payment.reference}`,
      `Invoice: ${payment.invoiceId}`,
      `Tenant: ${payment.invoice.tenant.fullName}`,
      `Amount: GHS ${amount.toFixed(2)}`,
      `Method: ${payment.method}`,
      `Paid at: ${payment.paidAt?.toISOString() ?? payment.createdAt.toISOString()}`,
      '',
      'This is an operational receipt, not a tax invoice.',
    ];
    return {
      id: payment.id,
      reference: payment.reference,
      contentType: 'text/plain',
      body: lines.join('\n'),
    };
  }

  present(payment: {
    id: string;
    orgId: string;
    invoiceId: string;
    amount: { toString(): string };
    feeAmount: { toString(): string };
    chargedAmount: { toString(): string };
    currency: string;
    method: string;
    provider: string;
    direction: string;
    status: string;
    reference: string;
    providerRef: string | null;
    checkoutUrl: string | null;
    accessCode: string | null;
    paidAt: Date | null;
    createdBy: string | null;
    createdAt: Date;
  }) {
    return {
      id: payment.id,
      orgId: payment.orgId,
      invoiceId: payment.invoiceId,
      amount: toNumber(payment.amount),
      feeAmount: toNumber(payment.feeAmount),
      chargedAmount: toNumber(payment.chargedAmount),
      currency: payment.currency,
      method: payment.method,
      provider: payment.provider,
      direction: payment.direction,
      status: payment.status,
      reference: payment.reference,
      providerRef: payment.providerRef,
      checkoutUrl: payment.checkoutUrl,
      accessCode: payment.accessCode,
      paidAt: payment.paidAt,
      createdBy: payment.createdBy,
      createdAt: payment.createdAt,
    };
  }
}
