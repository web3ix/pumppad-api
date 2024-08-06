import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStep1722940061789 implements MigrationInterface {
    name = 'AddStep1722940061789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" ADD "stepId" integer DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "stepId"`);
    }

}
