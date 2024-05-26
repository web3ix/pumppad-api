import {
    CHAINS,
    CHAIN_ID,
    CHUNK_BLOCK_NUMBER,
    CONTRACTS,
    PUMP_TOPIC,
    randomRPC,
} from '@/blockchain/configs';
import { EvmService } from '@/blockchain/services';
import { NetworkConfigRepository } from '@/database/repositories';
import { CONFIG_KEYS } from '@/shared/constants';
import { formattedHexString } from '@/shared/utils';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';
import { ethers } from 'ethers';

@Injectable()
export class ScheduleService {
    private isCronRunning: Map<CHAIN_ID, boolean> = new Map<
        CHAIN_ID,
        boolean
    >();

    constructor(
        @InjectQueue('QUEUE') private readonly queue: Queue,

        private readonly evmService: EvmService,

        @Inject(NetworkConfigRepository)
        private networkConfigRepo: NetworkConfigRepository,
    ) {}

    @Cron(CronExpression.EVERY_5_SECONDS)
    async getPumpTxnLogs() {
        this._runCron(
            CHAIN_ID.SEPOLIA,
            this._getPumpTxnLogsEvm(CHAIN_ID.SEPOLIA),
        );
    }

    private async _runCron(chainId: CHAIN_ID, callback: Promise<any>) {
        try {
            if (this.isCronRunning.get(chainId)) return;
            this.isCronRunning.set(chainId, true);
            await callback;
            this.isCronRunning.set(chainId, false);
        } catch (error) {
            console.log(
                '🚀 ~ file: schedule.service.ts:52 ~ ScheduleService ~ _runCron ~ error:',
                error,
            );
            this.isCronRunning.set(chainId, false);
        }
    }

    private async _getPumpTxnLogsEvm(chainId: CHAIN_ID) {
        const provider = this.evmService.getProvider(
            randomRPC(CHAINS[chainId].rpcUrls),
        );

        const config = await this.networkConfigRepo.findOne({
            where: { key: CONFIG_KEYS(chainId).GET_PUMP_TXN_LOGS },
        });

        if (config.data?.isRunning) return;

        let _toBlock = config.data.endBlock;
        if (!_toBlock) {
            _toBlock = (await provider.getBlock('latest')).number;
        }
        const PUMP = CONTRACTS[chainId].PUMP;
        const currentFromBlock = +(
            config.data.startBlock ??
            PUMP.deployedBlock ??
            1
        );
        if (currentFromBlock >= _toBlock) return;
        const currentToBlock =
            _toBlock > currentFromBlock + CHUNK_BLOCK_NUMBER[chainId]
                ? currentFromBlock + CHUNK_BLOCK_NUMBER[chainId]
                : _toBlock;

        // get PUMP txn logs
        const logs: ethers.providers.Log[] = await provider.send(
            'eth_getLogs',
            [
                {
                    address: PUMP.address,
                    fromBlock: formattedHexString(currentFromBlock),
                    toBlock: formattedHexString(currentToBlock),
                    topics: [[...Object.values(PUMP_TOPIC)]],
                },
            ],
        );

        await this.queue.add(
            'EVM_PUMP_TXN_LOGS',
            {
                chainId,
                logs: logs,
            },
            {
                removeOnComplete: 20,
            },
        );
        return this.networkConfigRepo.update(
            { key: CONFIG_KEYS(chainId).GET_PUMP_TXN_LOGS },
            {
                data: {
                    isRunning: false,
                    startBlock: currentToBlock,
                },
            },
        );
    }
}
