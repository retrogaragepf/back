import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  private getFromAddress(): string {
    return (
      this.configService.get<string>('EMAIL_FROM') ||
      'RetroGarage <retrogaragepf@gmail.com>'
    );
  }

  async sendWelcomeEmail(to: string, name: string) {
    await this.mailerService.sendMail({
      from: this.getFromAddress(),
      to,
      subject: 'Bienvenido a Retrogarage!',
      html: `<h1>Hola! ${name}</h1><p>Bienvenido a Retrogarage!. Estamos encantados de tenerte por aqui!</p>`,
    });
  }

  async sendDailySummary(
    to: string,
    name: string,
    totalUsers: number,
    totalOrders: number,
    totalProducts: number,
  ) {
    await this.mailerService.sendMail({
      from: this.getFromAddress(),
      to,
      subject: 'Resumen diario RetroGarage',
      html: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2 style="color:#d62828;">RetroGarage</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Este es el resumen diario de la plataforma:</p>
        <div style="background:#f1f1f1; padding:15px; border-radius:8px;">
          <p>Usuarios activos: <strong>${totalUsers}</strong></p>
          <p>Total de productos: <strong>${totalProducts}</strong></p>
          <p>Total de ordenes: <strong>${totalOrders}</strong></p>
        </div>
        <hr />
        <p style="font-size:12px;color:gray;">
          Gracias por confiar en RetroGarage.
        </p>
      </div>
    `,
    });
  }

  async sendProductImagePublishedEmail(
    to: string,
    name: string,
    productTitle: string,
    imageUrl: string,
  ) {
    await this.mailerService.sendMail({
      from: this.getFromAddress(),
      to,
      subject: 'Imagen publicada en RetroGarage',
      html: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2 style="color:#d62828;">RetroGarage</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Tu imagen para el producto <strong>${productTitle}</strong> fue publicada correctamente.</p>
        <p>
          <a href="${imageUrl}" target="_blank" rel="noopener noreferrer">
            Ver imagen publicada
          </a>
        </p>
      </div>
    `,
    });
  }

  async sendPurchaseConfirmationEmail(
    to: string,
    name: string,
    orderId: string,
    total: number,
    trackingCode: string,
    items: Array<{
      title: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>,
  ) {
    const money = (value: number) =>
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
      }).format(value);

    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #ddd;">${item.title}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${money(item.unitPrice)}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${money(item.subtotal)}</td>
      </tr>
    `,
      )
      .join('');

    await this.mailerService.sendMail({
      from: this.getFromAddress(),
      to,
      subject: 'Confirmacion de compra en RetroGarage',
      html: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2 style="color:#d62828;">Gracias por tu compra</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Tu compra fue confirmada exitosamente.</p>
        <p><strong>Orden:</strong> ${orderId}</p>
        <p><strong>Codigo de seguimiento:</strong> ${trackingCode}</p>
        <table style="width:100%; border-collapse:collapse; margin-top:16px;">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px;border-bottom:2px solid #ccc;">Producto</th>
              <th style="text-align:center;padding:8px;border-bottom:2px solid #ccc;">Cantidad</th>
              <th style="text-align:right;padding:8px;border-bottom:2px solid #ccc;">Precio</th>
              <th style="text-align:right;padding:8px;border-bottom:2px solid #ccc;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="margin-top:16px;"><strong>Total pagado:</strong> ${money(total)}</p>
      </div>
    `,
    });
  }

  async sendSaleConfirmationEmail(
    to: string,
    name: string,
    orderId: string,
    trackingCode: string,
    items: Array<{
      title: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>,
  ) {
    const money = (value: number) =>
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
      }).format(value);

    const totalSold = items.reduce((sum, item) => sum + item.subtotal, 0);

    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #ddd;">${item.title}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${money(item.unitPrice)}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${money(item.subtotal)}</td>
      </tr>
    `,
      )
      .join('');

    await this.mailerService.sendMail({
      from: this.getFromAddress(),
      to,
      subject: 'Tu producto fue vendido en RetroGarage',
      html: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2 style="color:#d62828;">Nueva venta confirmada</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Tu producto fue vendido exitosamente en RetroGarage.</p>
        <p><strong>Orden:</strong> ${orderId}</p>
        <p><strong>Codigo de seguimiento:</strong> ${trackingCode}</p>
        <table style="width:100%; border-collapse:collapse; margin-top:16px;">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px;border-bottom:2px solid #ccc;">Producto</th>
              <th style="text-align:center;padding:8px;border-bottom:2px solid #ccc;">Cantidad</th>
              <th style="text-align:right;padding:8px;border-bottom:2px solid #ccc;">Precio</th>
              <th style="text-align:right;padding:8px;border-bottom:2px solid #ccc;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="margin-top:16px;"><strong>Total vendido:</strong> ${money(totalSold)}</p>
      </div>
    `,
    });
  }

  async sendProductReviewStatusEmail(
    to: string,
    name: string,
    productTitle: string,
    status: 'approved' | 'rejected',
  ) {
    const isApproved = status === 'approved';
    const subject = isApproved
      ? 'Tu solicitud de producto fue aprobada'
      : 'Tu solicitud de producto fue rechazada';
    const message = isApproved
      ? `Tu solicitud para publicar el producto <strong>${productTitle}</strong> fue aprobada por el administrador.`
      : `Tu solicitud para publicar el producto <strong>${productTitle}</strong> fue rechazada por el administrador.`;

    await this.mailerService.sendMail({
      from: this.getFromAddress(),
      to,
      subject,
      html: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2 style="color:#d62828;">Estado de tu solicitud de producto</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>${message}</p>
      </div>
    `,
    });
  }
}
