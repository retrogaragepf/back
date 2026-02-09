import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { environment } from './environment';
dotenvConfig({ path: '.development.env' });

const config = {
  type: 'postgres',
  database: environment.DB_NAME,
  host: environment.DB_HOST,
  port: Number(environment.DB_PORT),
  username: environment.DB_USERNAME,
  password: environment.DB_PASSWORD,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  autoLoadEntities: true,
  logging: false,
  synchronize: true,
  dropSchema: false, //! PASAR A FALSE EN PRODUCCIÓN!!!
  // url: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false },//* Si me tira error el render es por esto:
};

export const typeOrmConfig = registerAs('typeorm', () => config);

export const connectionSource = new DataSource(config as DataSourceOptions);
