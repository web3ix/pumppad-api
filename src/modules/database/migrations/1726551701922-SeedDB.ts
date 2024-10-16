import { MigrationInterface, QueryRunner } from 'typeorm';
import { NetworkConfigEntity, NetworkEntity } from '../entities';
import { CHAINS, CHAIN_ID, CONTRACTS } from '../../blockchain/configs';
import { CONFIG_KEYS } from '../../../shared/constants';

export class SeedDB1726551701922 implements MigrationInterface {
    name = 'SeedDB1726551701922';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.query(
            `INSERT INTO "network"("id", "createdAt", "updatedAt", "deletedAt", "name", "chainId", "url", "explorerUrl", "icon") VALUES (DEFAULT, DEFAULT, DEFAULT, DEFAULT, $1, $2, DEFAULT, DEFAULT, DEFAULT)`,
            [CHAINS[CHAIN_ID.SOLANA_DEVNET].name, CHAIN_ID.SOLANA_DEVNET],
        );

        await queryRunner.manager.save(NetworkConfigEntity, {
            key: CONFIG_KEYS(CHAIN_ID.SOLANA_DEVNET).GET_PUMP_TXN_LOGS,
            data: {
                isRunning: false,
                runAt: Date.now(),
                stop: false,
                startSignature: process.env.CURVE_DEPLOYER_SIGNATURE ?? '',
            },
        });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
