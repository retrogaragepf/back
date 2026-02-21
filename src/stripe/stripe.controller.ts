import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { Request } from 'express';
import { DiscountService } from 'src/discountCode/discountCode.service';

@Controller('api/stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly dicountService: DiscountService,
  ) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  createCheckout(
    @Req() req: Request,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.stripeService.createCheckoutSession(
      user.id,
      dto.items,
      req,
      dto.discountCode ?? dto.couponCode ?? dto.code,
    );
  }

  @Post('webhook')
  webhook(@Req() req: Request, @Headers('stripe-signature') signature: string) {
    return this.stripeService.handleWebhook(
      req as Request & { body: Buffer },
      signature,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  async getSession(@Query('session_id') sessionId: string) {
    return this.stripeService.getSession(sessionId);
  }
}
