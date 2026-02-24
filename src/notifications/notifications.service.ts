import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/order.service';
import { ProductsDbService } from 'src/products/productsDb.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsDbService,
  ) {}

  @Cron('0 30 13 * * *', {
    timeZone: 'America/Bogota',
  })
  async sendDailyHighlights() {
    console.log('Enviando resumen diario 1:30 PM...');
    try {
      const activeUsers = await this.usersService.getActiveUsers();
      if (!activeUsers.length) {
        console.log('No hay usuarios activos.');
        return;
      }
      const usersToNotify = activeUsers.slice(0, 10);
      const totalUsers = activeUsers.length;
      const totalOrders = await this.ordersService.getTotalOrders();
      const totalProducts = await this.productsService.getTotalProducts();
      console.log(
        `Usuarios activos: ${totalUsers} | Órdenes: ${totalOrders} | Productos: ${totalProducts}`,
      );
      for (const user of usersToNotify) {
        await this.emailService.sendDailySummary(
          user.email,
          user.name,
          totalUsers,
          totalOrders,
          totalProducts,
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      console.log(
        `Resumen enviado correctamente a ${usersToNotify.length} usuarios.`,
      );
    } catch (error) {
      console.error('Error en cron:', error);
    }
  }
}
