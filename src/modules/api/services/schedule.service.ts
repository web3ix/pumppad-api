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
import * as anchor from '@project-serum/anchor';
import { BorshCoder, EventParser } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './sdk/constants';

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
            CHAIN_ID.SOLANA_DEVNET,
            this._getPumpTxnLogsSolana(CHAIN_ID.SOLANA_DEVNET),
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

    private async _getPumpTxnLogsSolana(chainId: CHAIN_ID) {
        const connection = new Connection(randomRPC(CHAINS[chainId].rpcUrls), {
            commitment: 'confirmed',
        });

        const config = await this.networkConfigRepo.findOne({
            where: { key: CONFIG_KEYS(chainId).GET_PUMP_TXN_LOGS },
        });

        if (config.data?.isRunning) return;
        await this.networkConfigRepo.update(
            { key: CONFIG_KEYS(chainId).GET_PUMP_TXN_LOGS },
            {
                data: {
                    ...config.data,
                    isRunning: true,
                },
            },
        );

        const currentFromSignature = config.data.startSignature;
        let transactionList = await connection.getSignaturesForAddress(
            PROGRAM_ID,
            {
                limit: 1000,
                until: currentFromSignature,
            },
        );
        if (!transactionList.length) {
            return this.networkConfigRepo.update(
                { key: CONFIG_KEYS(chainId).GET_PUMP_TXN_LOGS },
                {
                    data: {
                        ...config.data,
                        isRunning: false,
                    },
                },
            );
        }

        let signatures = transactionList.map(
            (transaction) => transaction.signature,
        );

        await this.queue.add(
            'SOLANA_PUMP_TXN_LOGS',
            {
                chainId,
                signatures: signatures,
            },
            {
                removeOnComplete: 20,
            },
        );
        return this.networkConfigRepo.update(
            { key: CONFIG_KEYS(chainId).GET_PUMP_TXN_LOGS },
            {
                data: {
                    ...config.data,
                    isRunning: false,
                    startSignature: signatures[0],
                },
            },
        );
    }
}
