import { PUMP_TOPIC } from '@/blockchain/configs';
import { EvmService } from '@/blockchain/services';
import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import { BigNumber, ethers } from 'ethers';
import { PumpService } from './pump.service';

@Processor('QUEUE')
export class ConsumerService {
    constructor(
        @Inject(PumpService)
        private readonly pumpService: PumpService,

        @Inject(EvmService)
        private readonly evmService: EvmService,
    ) {}

    @Process('EVM_PUMP_TXN_LOGS')
    async processOTCTxnLogsEvm(job: Job<{ logs: ethers.providers.Log[] }>) {
        const { logs } = job.data;
        const length = logs.length;

        for (let i = 0; i < length; i++) {
            const log = logs[i];
            switch (log.topics[0]) {
                case PUMP_TOPIC.TOKEN_CREATED:
                    await this.handleTokenCreatedEvm(log);
                    break;
                case PUMP_TOPIC.BUY:
                    await this.handleBuyEvm(log);
                    break;
                case PUMP_TOPIC.SELL:
                    await this.handleSellEvm(log);
                    break;
                default:
                    break;
            }
        }
    }

    private async handleTokenCreatedEvm(log: ethers.providers.Log) {
        try {
            const event = await this.pumpService.decodeEventEvm<{
                token: string;
                name: string;
                symbol: string;
                reserveToken: string;
            }>('TokenCreated', log);

            return this.pumpService.createToken(
                event.token,
                event.name,
                event.symbol,
                event.reserveToken,
            );
        } catch (error) {
            console.log(
                '🚀 ~ file: consumer.service.ts:75 ~ ConsumerService ~ error:',
                error,
            );
        }
    }

    private async handleBuyEvm(log: ethers.providers.Log) {
        try {
            const event = await this.pumpService.decodeEventEvm<{
                token: string;
                user: string;
                receiver: string;
                amountMinted: BigNumber;
                reserveToken: string;
                reserveAmount: BigNumber;
            }>('Buy', log);

            return this.pumpService.createBuyEvent(
                event.token,
                event.user,
                event.receiver,
                event.amountMinted,
                event.reserveToken,
                event.reserveAmount,
            );
        } catch (error) {
            console.log(
                '🚀 ~ file: consumer.service.ts:75 ~ ConsumerService ~ error:',
                error,
            );
        }
    }

    private async handleSellEvm(log: ethers.providers.Log) {
        try {
            const event = await this.pumpService.decodeEventEvm<{
                token: string;
                user: string;
                receiver: string;
                amountBurned: BigNumber;
                reserveToken: string;
                refundAmount: BigNumber;
            }>('Sell', log);

            return this.pumpService.createSellEvent(
                event.token,
                event.user,
                event.receiver,
                event.amountBurned,
                event.reserveToken,
                event.refundAmount,
            );
        } catch (error) {
            console.log(
                '🚀 ~ file: consumer.service.ts:75 ~ ConsumerService ~ error:',
                error,
            );
        }
    }
}
