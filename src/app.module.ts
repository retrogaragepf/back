import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { CartModule } from './carts/cart.module';
import { SeederModule } from './seeders/seeder.module';
import { StripeModule } from './stripe/stripe.module';
import { ChatModule } from './chat/chat.module';
import { OrdersModule } from './orders/order.module';
import { VentasModule } from './ventas/ventas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
      load: [typeOrmConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get<TypeOrmModuleOptions>('typeorm')!,
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    CartModule,
    SeederModule,
    StripeModule,
    ChatModule,
    OrdersModule,
    VentasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
