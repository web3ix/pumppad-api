import { MigrationInterface, QueryRunner } from 'typeorm';
import { NetworkConfigEntity, NetworkEntity } from '../entities';
import { CHAINS, CHAIN_ID, CONTRACTS } from '../../blockchain/configs';
import { CONFIG_KEYS } from '../../../shared/constants';

export class SeedDB1722937553644 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.save(NetworkEntity, {
            name: CHAINS[CHAIN_ID.SOLANA_DEVNET].name,
            chainId: CHAIN_ID.SOLANA_DEVNET,
        });

        await queryRunner.manager.save(NetworkConfigEntity, {
            key: CONFIG_KEYS(CHAIN_ID.SOLANA_DEVNET).GET_PUMP_TXN_LOGS,
            data: {
                isRunning: false,
                runAt: Date.now(),
                stop: false,
                startBlock:
                    CONTRACTS[CHAIN_ID.SOLANA_DEVNET].PUMP.deployedBlock,
                startSignature:
                    CONTRACTS[CHAIN_ID.SOLANA_DEVNET].PUMP.deployedSignature,
            },
        });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
