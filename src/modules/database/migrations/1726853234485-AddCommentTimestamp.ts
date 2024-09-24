import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommentTimestamp1726853234485 implements MigrationInterface {
    name = 'AddCommentTimestamp1726853234485'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment" ADD "timestamp" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment" DROP COLUMN "timestamp"`);
    }

}
