import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokennomics1726552602299 implements MigrationInterface {
    name = 'AddTokennomics1726552602299'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" ADD "tokenomics" text NOT NULL DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "tokenomics"`);
    }

}
