import { CHAINS, CHAIN_ID, randomRPC } from '@/blockchain/configs';
import { EvmService } from '@/blockchain/services';
import { NetworkConfigRepository } from '@/database/repositories';
import { CONFIG_KEYS } from '@/shared/constants';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Connection, PublicKey } from '@solana/web3.js';
import { Queue } from 'bull';
import { PROGRAM_ID } from './sdk/constants';

@Injectable()
export class ScheduleService {
    private isCronRunning: Map<CHAIN_ID, boolean> = new Map<
        CHAIN_ID,
        boolean
    >();

    constructor(
        @InjectQueue('QUEUE') private readonly queue: Queue,

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
        const config = await this.networkConfigRepo.findOne({
            where: { key: CONFIG_KEYS(chainId).GET_PUMP_TXN_LOGS },
        });

        try {
            const connection = new Connection(
                randomRPC(CHAINS[chainId].rpcUrls),
                {
                    commitment: 'confirmed',
                },
            );

            const currentFromSignature = config.data.startSignature;
            let payload: any = {
                limit: 1000,
            };
            if (!currentFromSignature) {
                payload = {
                    ...payload,
                    until: currentFromSignature,
                };
            }
            let transactionList = await connection.getSignaturesForAddress(
                process.env.CURVE_PROGRAM_ID
                    ? new PublicKey(process.env.CURVE_PROGRAM_ID)
                    : PROGRAM_ID,
                {
                    ...payload,
                },
            );

            if (!transactionList.length) return;

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
        } catch (error) {
            return;
        }
    }
}
