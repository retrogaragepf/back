import 'dotenv/config';
import { DataSource } from 'typeorm';

const isTsRuntime = __filename.endsWith('.ts');
const extension = isTsRuntime ? 'ts' : 'js';
const rootDir = isTsRuntime ? 'src' : 'dist';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [`${rootDir}/**/*.entity.${extension}`],
  migrations: [`${rootDir}/migrations/*.${extension}`],
  synchronize: false,
});

export default AppDataSource;
