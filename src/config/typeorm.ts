import { registerAs } from '@nestjs/config';

export const typeOrmConfig = registerAs('typeorm', () => ({
  type: 'postgres',
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  autoLoadEntities: true,
  synchronize: false,
  dropSchema: false, //! PASAR A FALSE EN PRODUCCIÓN!!!
}));
