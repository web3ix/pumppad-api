import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDB1722937546265 implements MigrationInterface {
    name = 'InitDB1722937546265'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "network-config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "key" character varying NOT NULL, "data" text NOT NULL DEFAULT '{}', CONSTRAINT "UQ_692381764e7922dda3dc2b5aaa6" UNIQUE ("key"), CONSTRAINT "PK_be94c55ee451e00d939158b09be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_692381764e7922dda3dc2b5aaa" ON "network-config" ("key") `);
        await queryRunner.query(`CREATE TABLE "network" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying, "chainId" integer NOT NULL, "url" character varying NOT NULL DEFAULT '', "explorerUrl" character varying NOT NULL DEFAULT '', "icon" character varying NOT NULL DEFAULT '', CONSTRAINT "UQ_9f79766aae97061ce6d051470ad" UNIQUE ("chainId"), CONSTRAINT "PK_8f8264c2d37cbbd8282ee9a3c97" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9f79766aae97061ce6d051470a" ON "network" ("chainId") `);
        await queryRunner.query(`CREATE TABLE "trade" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "isBuy" boolean NOT NULL, "doer" character varying NOT NULL, "amount" character varying NOT NULL, "reserveAmount" character varying NOT NULL, "parseAmount" numeric NOT NULL, "parseReserveAmount" numeric NOT NULL, "timestamp" integer NOT NULL, "tokenId" uuid, CONSTRAINT "PK_d4097908741dc408f8274ebdc53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "token" character varying NOT NULL, "creator" character varying NOT NULL, "activated" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "symbol" character varying NOT NULL, "uri" character varying NOT NULL, "timestamp" integer NOT NULL, "lastPrice" numeric, CONSTRAINT "PK_82fae97f905930df5d62a702fc9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "trade" ADD CONSTRAINT "FK_6c2a8840e9350ec8e50a7fb856a" FOREIGN KEY ("tokenId") REFERENCES "token"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trade" DROP CONSTRAINT "FK_6c2a8840e9350ec8e50a7fb856a"`);
        await queryRunner.query(`DROP TABLE "token"`);
        await queryRunner.query(`DROP TABLE "trade"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f79766aae97061ce6d051470a"`);
        await queryRunner.query(`DROP TABLE "network"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_692381764e7922dda3dc2b5aaa"`);
        await queryRunner.query(`DROP TABLE "network-config"`);
    }

}
