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
}
