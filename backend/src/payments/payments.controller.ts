import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { THROTTLE_SKIP_ALL } from '../common/throttler/throttle.constants';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  checkout(@Body() dto: CreateCheckoutDto, @CurrentUser() user?: JwtUser) {
    return this.paymentsService.checkout(dto, user);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager', 'finance')
  post(@CurrentUser() user: JwtUser, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.postManual(user.orgId, user.sub, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager', 'finance')
  list(@CurrentUser() user: JwtUser, @Query() query: ListPaymentsQueryDto) {
    return this.paymentsService.list(user.orgId, query);
  }

  @Get('ledger')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager', 'finance')
  ledger(@CurrentUser() user: JwtUser) {
    return this.paymentsService.ledger(user.orgId);
  }

  @Get('verify/:reference')
  verify(@Param('reference') reference: string) {
    return this.paymentsService.verify(reference);
  }

  @Post('webhook')
  @HttpCode(200)
  @SkipThrottle(THROTTLE_SKIP_ALL)
  webhook(
    @Headers('x-paystack-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const raw = req.rawBody;
    if (!raw) {
      return this.paymentsService.handleWebhook(
        Buffer.from(JSON.stringify(req.body ?? {})),
        signature,
      );
    }
    return this.paymentsService.handleWebhook(raw, signature);
  }
}
