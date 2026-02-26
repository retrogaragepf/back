import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAddressToUsers20260225170000 implements MigrationInterface {
  name = 'AddAddressToUsers20260225170000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "USERS"
      ADD COLUMN IF NOT EXISTS "address" character varying(255);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "USERS"
      DROP COLUMN IF EXISTS "address";
    `);
  }
}
