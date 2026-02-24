import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendWelcomeEmail(to: string, name: string) {
    await this.mailerService.sendMail({
      from: 'RetroGarage <retrogaragepf@gmail.com>',
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
      from: 'RetroGarage <retrogaragepf@gmail.com>',
      to,
      subject: 'Resumen diario RetroGarage 🚗',
      html: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2 style="color:#d62828;">🚗 RetroGarage</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Este es el resumen diario de la plataforma:</p>
        <div style="background:#f1f1f1; padding:15px; border-radius:8px;">
          <p>👥 Usuarios activos: <strong>${totalUsers}</strong></p>
          <p>📦 Total de productos: <strong>${totalProducts}</strong></p>
          <p>🧾 Total de órdenes: <strong>${totalOrders}</strong></p>
        </div>
        <hr />
        <p style="font-size:12px;color:gray;">
          Gracias por confiar en RetroGarage.
        </p>
      </div>
    `,
    });
  }
}
