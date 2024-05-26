import { MigrationInterface, QueryRunner } from 'typeorm';
import { NetworkConfigEntity, NetworkEntity } from '../entities';
import { CHAINS, CHAIN_ID, CONTRACTS } from '../../blockchain/configs';
import { CONFIG_KEYS } from '../../../shared/constants';

export class SeedTestnetNetwork1716733947870 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.save(NetworkEntity, {
            name: CHAINS[CHAIN_ID.SEPOLIA].name,
            chainId: CHAIN_ID.SEPOLIA,
        });

        await queryRunner.manager.save(NetworkConfigEntity, {
            key: CONFIG_KEYS(CHAIN_ID.SEPOLIA).GET_PUMP_TXN_LOGS,
            chainId: CHAIN_ID.SEPOLIA,
            isRunning: false,
            runAt: Date.now(),
            stop: false,
            startBlock: CONTRACTS[CHAIN_ID.SEPOLIA].PUMP.deployedBlock,
        });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
