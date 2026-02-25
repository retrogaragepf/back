import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeToNotifications20260225154000
  implements MigrationInterface
{
  name = 'AddTypeToNotifications20260225154000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "public"."notifications_type_enum" AS ENUM (
          'daily_summary',
          'purchase',
          'sale',
          'order_shipped',
          'order_delivered',
          'product_approved',
          'product_rejected'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD COLUMN IF NOT EXISTS "type" "public"."notifications_type_enum";
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ALTER COLUMN "type" SET DEFAULT 'daily_summary';
    `);

    await queryRunner.query(`
      UPDATE "notifications"
      SET "type" = 'daily_summary'
      WHERE "type" IS NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ALTER COLUMN "type" SET NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ALTER COLUMN "type" DROP NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ALTER COLUMN "type" DROP DEFAULT;
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      DROP COLUMN IF EXISTS "type";
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'notifications_type_enum'
            AND n.nspname = 'public'
        ) THEN
          DROP TYPE "public"."notifications_type_enum";
        END IF;
      EXCEPTION
        WHEN dependent_objects_still_exist THEN NULL;
      END $$;
    `);
  }
}
