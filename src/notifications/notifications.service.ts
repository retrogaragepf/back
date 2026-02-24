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

  // @Cron('0 20 13 * * *', {
  //   timeZone: 'America/Bogota',
  // })
  @Cron('0 * * * * *') // 👈 para pruebas
  async sendDailyHighlights() {
    console.log('⏰ Enviando resumen diario 1:20 PM...');
    try {
      const activeUsers = await this.usersService.getActiveUsers();
      if (!activeUsers.length) {
        console.log('No hay usuarios activos.');
        return;
      }
      const totalUsers = activeUsers.length;
      const totalOrders = await this.ordersService.getTotalOrders();
      const totalProducts = await this.productsService.getTotalProducts();
      await Promise.all(
        activeUsers.map((user) =>
          this.emailService.sendDailySummary(
            user.email,
            user.name,
            totalUsers,
            totalOrders,
            totalProducts,
          ),
        ),
      );
      console.log(`✅ Resumen enviado a ${totalUsers} usuarios activos.`);
    } catch (error) {
      console.error('❌ Error en cron:', error);
    }
  }
}
