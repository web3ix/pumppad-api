import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDB1716741346244 implements MigrationInterface {
    name = 'InitDB1716741346244'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "network-config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "key" character varying NOT NULL, "data" text NOT NULL DEFAULT '{}', CONSTRAINT "UQ_692381764e7922dda3dc2b5aaa6" UNIQUE ("key"), CONSTRAINT "PK_be94c55ee451e00d939158b09be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_692381764e7922dda3dc2b5aaa" ON "network-config" ("key") `);
        await queryRunner.query(`CREATE TABLE "network" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying, "chainId" integer NOT NULL, "url" character varying NOT NULL DEFAULT '', "explorerUrl" character varying NOT NULL DEFAULT '', "icon" character varying NOT NULL DEFAULT '', CONSTRAINT "UQ_9f79766aae97061ce6d051470ad" UNIQUE ("chainId"), CONSTRAINT "PK_8f8264c2d37cbbd8282ee9a3c97" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9f79766aae97061ce6d051470a" ON "network" ("chainId") `);
        await queryRunner.query(`CREATE TABLE "buy" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "user" character varying NOT NULL, "receiver" character varying NOT NULL, "amountMinted" character varying NOT NULL, "reserveToken" character varying NOT NULL, "reserveAmount" character varying NOT NULL, "tokenId" uuid, CONSTRAINT "PK_634c4687b54f6a44ac0c142adf7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sell" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "user" character varying NOT NULL, "receiver" character varying NOT NULL, "amountBurned" character varying NOT NULL, "reserveToken" character varying NOT NULL, "refundAmount" character varying NOT NULL, "tokenId" uuid, CONSTRAINT "PK_8cc9d759945a4176103696feedf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "token" character varying NOT NULL DEFAULT '', "name" character varying NOT NULL DEFAULT '', "symbol" character varying NOT NULL DEFAULT '', "decimals" integer NOT NULL DEFAULT '18', "description" character varying, "reserveToken" character varying NOT NULL DEFAULT '', "image" character varying, "twitterLink" character varying, "telegramLink" character varying, "website" character varying, CONSTRAINT "PK_82fae97f905930df5d62a702fc9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "buy" ADD CONSTRAINT "FK_ef9c5e04d6549a8e50f0065335a" FOREIGN KEY ("tokenId") REFERENCES "token"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sell" ADD CONSTRAINT "FK_ef2d37127e7701987ba29c8c29f" FOREIGN KEY ("tokenId") REFERENCES "token"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sell" DROP CONSTRAINT "FK_ef2d37127e7701987ba29c8c29f"`);
        await queryRunner.query(`ALTER TABLE "buy" DROP CONSTRAINT "FK_ef9c5e04d6549a8e50f0065335a"`);
        await queryRunner.query(`DROP TABLE "token"`);
        await queryRunner.query(`DROP TABLE "sell"`);
        await queryRunner.query(`DROP TABLE "buy"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f79766aae97061ce6d051470a"`);
        await queryRunner.query(`DROP TABLE "network"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_692381764e7922dda3dc2b5aaa"`);
        await queryRunner.query(`DROP TABLE "network-config"`);
    }

}
