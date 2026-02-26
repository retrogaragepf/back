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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Payments - Stripe')
@Controller('api/stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly dicountService: DiscountService,
  ) {}

  // ===============================
  // CREATE CHECKOUT SESSION
  // ===============================

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Crear sesión de checkout',
    description:
      'Crea una sesión de pago en Stripe para los productos enviados. Requiere autenticación.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sesión de Stripe creada correctamente',
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario no autenticado',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o productos inexistentes',
  })
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

  // ===============================
  // STRIPE WEBHOOK
  // ===============================

  @Post('webhook')
  @ApiOperation({
    summary: 'Webhook de Stripe',
    description:
      'Endpoint utilizado por Stripe para enviar eventos (confirmación de pago, fallos, etc). No requiere autenticación JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Evento recibido correctamente',
  })
  @ApiBadRequestResponse({
    description: 'Firma inválida o evento no válido',
  })
  webhook(@Req() req: Request, @Headers('stripe-signature') signature: string) {
    return this.stripeService.handleWebhook(
      req as Request & { body: Buffer },
      signature,
    );
  }

  // ===============================
  // GET SESSION STATUS
  // ===============================

  @Get('session')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener estado de una sesión de Stripe',
    description:
      'Consulta el estado de una sesión de pago utilizando el session_id.',
  })
  @ApiQuery({
    name: 'session_id',
    required: true,
    description: 'ID de la sesión de Stripe',
  })
  @ApiResponse({
    status: 200,
    description: 'Devuelve la información de la sesión',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido o ausente',
  })
  async getSession(@Query('session_id') sessionId: string) {
    return this.stripeService.getSession(sessionId);
  }
}
