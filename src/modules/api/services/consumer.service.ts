import { CHAIN_ID, PUMP_TOPIC } from '@/blockchain/configs';
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
    async processOTCTxnLogsEvm(
        job: Job<{ chainId: CHAIN_ID; logs: ethers.providers.Log[] }>,
    ) {
        const { chainId, logs } = job.data;
        const length = logs.length;

        for (let i = 0; i < length; i++) {
            const log = logs[i];
            switch (log.topics[0]) {
                case PUMP_TOPIC.TOKEN_CREATED:
                    await this.handleTokenCreatedEvm(chainId, log);
                    break;
                case PUMP_TOPIC.BUY:
                    await this.handleBuyEvm(chainId, log);
                    break;
                case PUMP_TOPIC.SELL:
                    await this.handleSellEvm(chainId, log);
                    break;
                default:
                    break;
            }
        }
    }

    private async handleTokenCreatedEvm(
        chainId: CHAIN_ID,
        log: ethers.providers.Log,
    ) {
        try {
            const event = await this.pumpService.decodeEventEvm<{
                token: string;
                name: string;
                symbol: string;
                reserveToken: string;
            }>('TokenCreated', log);

            console.log(event.name);

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

    private async handleBuyEvm(chainId: CHAIN_ID, log: ethers.providers.Log) {
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

    private async handleSellEvm(chainId: CHAIN_ID, log: ethers.providers.Log) {
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
