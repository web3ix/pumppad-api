import { CHAINS, CHAIN_ID, randomRPC } from '@/blockchain/configs';
import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { BorshCoder, EventParser } from '@project-serum/anchor';
import { Connection } from '@solana/web3.js';
import { Job } from 'bull';
import { BondService } from './bond.service';
import CurveSdk from './sdk/Curve';

@Processor('QUEUE')
export class ConsumerService {
    constructor(
        @Inject(BondService)
        private readonly bondService: BondService,
    ) {}

    @Process('SOLANA_PUMP_TXN_LOGS')
    async processOTCTxnLogsSolana(
        job: Job<{ chainId: CHAIN_ID; signatures: string[] }>,
    ) {
        const { signatures, chainId } = job.data;

        const connection = new Connection(randomRPC(CHAINS[chainId].rpcUrls), {
            commitment: 'confirmed',
        });
        const sdk = new CurveSdk(connection);

        let _signatures = signatures.reverse();
        for await (const sig of _signatures) {
            try {
                const tx = await sdk.connection.getParsedTransaction(sig, {
                    commitment: 'confirmed',
                });

                const eventParser = new EventParser(
                    sdk.program.programId,
                    new BorshCoder(sdk.program.idl),
                );
                const events = eventParser.parseLogs(tx.meta.logMessages);
                for await (const event of events) {
                    switch (event.name) {
                        case 'NewTokenEvent':
                            await this.bondService.createToken(
                                event.data.token.toString(),
                                event.data.creator.toString(),
                                event.data.name.toString(),
                                event.data.symbol.toString(),
                                event.data.uri.toString(),
                                tx.blockTime,
                            );
                            break;

                        case 'ActivateTokenEvent':
                            await this.bondService.activateToken(
                                event.data.token.toString(),
                            );
                            break;

                        case 'BuyEvent':
                            await this.bondService.createBuyEvent(
                                sig,
                                event.data.token.toString(),
                                event.data.buyer.toString(),
                                event.data.amount.toString(),
                                event.data.reserve.toString(),
                                event.data.totalSupply.toString(),
                                event.data.totalReserve.toString(),
                                tx.blockTime,
                            );
                            break;

                        case 'SellEvent':
                            await this.bondService.createSellEvent(
                                sig,
                                event.data.token.toString(),
                                event.data.seller.toString(),
                                event.data.amount.toString(),
                                event.data.reserve.toString(),
                                event.data.totalSupply.toString(),
                                event.data.totalReserve.toString(),
                                tx.blockTime,
                            );
                            break;

                        default:
                            break;
                    }
                }
            } catch (error) {
                console.log(
                    '🚀 ~ file: consumer.service.ts:75 ~ ConsumerService ~ forawait ~ error:',
                    error,
                );
            }
        }
    }
}
