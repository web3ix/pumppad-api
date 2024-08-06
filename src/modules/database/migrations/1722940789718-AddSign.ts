import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSign1722940789718 implements MigrationInterface {
    name = 'AddSign1722940789718'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trade" ADD "signature" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trade" DROP COLUMN "signature"`);
    }

}
