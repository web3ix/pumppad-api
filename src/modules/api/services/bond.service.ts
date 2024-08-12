import { EvmService } from '@/blockchain/services';
import { TradeEntity, TokenEntity } from '@/database/entities';
import { TradeRepository, TokenRepository } from '@/database/repositories';
import { PumpAbi } from '@/shared/blockchain/abis';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { BigNumber, ethers } from 'ethers';
import { SocketService } from './socket.service';
import { Between, LessThan } from 'typeorm';

const PRECISION = BigNumber.from('1000000000000000000');

@Injectable()
export class BondService {
    constructor(
        @Inject(EvmService)
        private readonly evmService: EvmService,

        @Inject(TokenRepository)
        private tokenRepo: TokenRepository,

        @Inject(TradeRepository)
        private tradeRepo: TradeRepository,

        private readonly socketClient: SocketService,
    ) {}

    async createToken(
        token: string,
        creator: string,
        name: string,
        symbol: string,
        uri: string,
        timestamp: number,
    ) {
        const tokenEntity = await this.tokenRepo.findOne({
            where: { token },
        });

        if (tokenEntity) return tokenEntity;

        const newToken = new TokenEntity();
        newToken.token = token;
        newToken.creator = creator;
        newToken.activated = false;
        newToken.name = name;
        newToken.symbol = symbol;
        newToken.uri = uri;
        newToken.timestamp = timestamp;

        return this.tokenRepo.save(newToken);
    }

    async activateToken(token: string, stepId: number) {
        const _token = await this.tokenRepo.findOne({
            where: {
                token,
                activated: false,
            },
        });

        await this.tokenRepo.update(
            {
                token,
                activated: false,
            },
            {
                activated: true,
                stepId: stepId,
            },
        );

        return this.socketClient.emitNewToken(
            _token.id,
            token,
            _token.creator,
            _token.name,
            _token.symbol,
            _token.uri,
            _token.timestamp,
        );
    }

    async createBuyEvent(
        signature: string,
        token: string,
        buyer: string,
        amount: string,
        reserveAmount: string,
        timestamp: number,
    ) {
        const tokenEntity = await this.tokenRepo.findOne({
            where: { token },
        });
        if (!tokenEntity) throw new Error('No Token');

        const buyEvent = new TradeEntity();
        buyEvent.signature = signature;
        buyEvent.token = tokenEntity;
        buyEvent.isBuy = true;
        buyEvent.doer = buyer;
        buyEvent.amount = amount;
        buyEvent.reserveAmount = reserveAmount;
        buyEvent.parseAmount = +ethers.utils.formatUnits(amount, 9);
        buyEvent.parseReserveAmount = +ethers.utils.formatUnits(
            reserveAmount,
            9,
        );
        buyEvent.timestamp = timestamp;

        const lastPrice = +ethers.utils.formatUnits(
            BigNumber.from(reserveAmount)
                .mul(PRECISION)
                .div(BigNumber.from(amount)),
            18,
        );

        let trade: TradeEntity;
        await this.tradeRepo.manager.transaction(
            async (transactionalEntityManager) => {
                trade = await this.tradeRepo.save(buyEvent);
                await this.tokenRepo.update(
                    { token },
                    {
                        lastPrice,
                    },
                );
            },
        );

        return this.socketClient.emitNewTrade(
            trade.id,
            buyEvent.signature,
            token,
            buyEvent.isBuy,
            buyEvent.doer,
            buyEvent.amount,
            buyEvent.reserveAmount,
            buyEvent.parseAmount,
            buyEvent.parseReserveAmount,
            buyEvent.timestamp,
            lastPrice,
        );
    }

    async createSellEvent(
        signature: string,
        token: string,
        seller: string,
        amount: string,
        reserveAmount: string,
        timestamp: number,
    ) {
        const tokenEntity = await this.tokenRepo.findOne({
            where: { token },
        });
        if (!tokenEntity) throw new Error('No Token');

        const sellEvent = new TradeEntity();
        sellEvent.signature = signature;
        sellEvent.token = tokenEntity;
        sellEvent.isBuy = false;
        sellEvent.doer = seller;
        sellEvent.amount = amount;
        sellEvent.reserveAmount = reserveAmount;
        sellEvent.parseAmount = +ethers.utils.formatUnits(amount, 9);
        sellEvent.parseReserveAmount = +ethers.utils.formatUnits(
            reserveAmount,
            9,
        );
        sellEvent.timestamp = timestamp;

        const lastPrice = +ethers.utils.formatUnits(
            BigNumber.from(reserveAmount)
                .mul(PRECISION)
                .div(BigNumber.from(amount)),
            18,
        );
        let trade: TradeEntity;
        await this.tradeRepo.manager.transaction(
            async (transactionalEntityManager) => {
                trade = await this.tradeRepo.save(sellEvent);
                await this.tokenRepo.update(
                    { token },
                    {
                        lastPrice,
                    },
                );
            },
        );

        return this.socketClient.emitNewTrade(
            trade.id,
            sellEvent.signature,
            token,
            sellEvent.isBuy,
            sellEvent.doer,
            sellEvent.amount,
            sellEvent.reserveAmount,
            sellEvent.parseAmount,
            sellEvent.parseReserveAmount,
            sellEvent.timestamp,
            lastPrice,
        );
    }

    async getTokens(take: number = 10, skip: number = 0) {
        return this.tokenRepo.find({
            where: {
                activated: true,
            },
            order: {
                updatedAt: 'DESC',
            },
            select: [
                'id',
                'token',
                'stepId',
                'creator',
                'name',
                'symbol',
                'uri',
                'trades',
                'lastPrice',
                'timestamp',
            ],
            take,
            skip,
        });
    }

    async getToken(token: string) {
        try {
            const tokenEntity = await this.tokenRepo.findOne({
                where: {
                    token: new PublicKey(token).toString(),
                    activated: true,
                },
                relations: {
                    trades: true,
                },
                select: [
                    'id',
                    'token',
                    'stepId',
                    'creator',
                    'name',
                    'symbol',
                    'uri',
                    'trades',
                    'lastPrice',
                    'timestamp',
                ],
                order: {
                    trades: {
                        timestamp: 'DESC',
                    },
                },
            });
            if (!tokenEntity) throw new NotFoundException();

            return tokenEntity;
        } catch (error) {
            throw new NotFoundException();
        }
    }

    async getLatestTrades() {
        return this.tradeRepo.find({
            where: {
                token: {
                    activated: true,
                },
            },
            order: {
                timestamp: 'DESC',
            },
            relations: {
                token: true,
            },
            take: 10,
            skip: 0,
        });
    }

    async getKingOfHill() {
        return this.tokenRepo.find({
            where: {
                activated: true,
            },
            order: {
                lastPrice: 'DESC',
            },
            relations: {
                trades: true,
            },
            select: [
                'id',
                'token',
                'creator',
                'name',
                'symbol',
                'uri',
                'trades',
                'lastPrice',
                'timestamp',
            ],
            take: 4,
            skip: 0,
        });
    }

    async getStats() {
        const [tokens, trades, kingOfHill] = await Promise.all([
            this.getTokens(),
            this.getLatestTrades(),
            this.getKingOfHill(),
        ]);

        return {
            tokens,
            trades,
            kingOfHill,
        };
    }

    async getTokenOHCL(symbol: string, from: number, to: number) {
        try {
            const token = await this.tokenRepo.findOne({
                where: { symbol },
                relations: { trades: true },
                order: {
                    trades: {
                        timestamp: 'ASC',
                    },
                },
            });

            if (
                !token ||
                !token.trades.length ||
                to < token.trades[0].timestamp
            )
                return {
                    s: 'no_data',
                };

            const result = await this.tradeRepo.query(
                `
                SELECT 

                    FLOOR(EXTRACT(EPOCH FROM to_timestamp("timestamp")) / 300) * 300 AS time,
                    MIN("parseReserveAmount" / "parseAmount") AS low, 
                    MAX("parseReserveAmount" / "parseAmount") AS high,
                    MIN(open) as open,
                    MIN(close) as close,
                    SUM("parseReserveAmount") as volume
                FROM (
                    select
                        "timestamp", "parseReserveAmount", "parseAmount",
                        FIRST_VALUE("parseReserveAmount" / "parseAmount") over (
                        PARTITION BY FLOOR(EXTRACT(EPOCH FROM to_timestamp("timestamp")) / 300) * 300 ORDER BY "timestamp" ASC
                        RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                    ) as open,
                    FIRST_VALUE("parseReserveAmount" / "parseAmount") over (
                        PARTITION BY FLOOR(EXTRACT(EPOCH FROM to_timestamp("timestamp")) / 300) * 300 ORDER BY "timestamp" DESC
                        RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                    ) as close
                    from "trade"
                    WHERE ( "trade"."tokenId" = '${token.id}') 	
                ) as tmp

                GROUP BY time
                ORDER BY time asc

                `,
            );

            //   // Transform the result into TradingView's expected format
            return {
                s: 'ok',
                t: result.map((row) => row.time),
                o: result.map((row) => parseFloat(row.open).toFixed(8)),
                h: result.map((row) => parseFloat(row.high).toFixed(8)),
                l: result.map((row) => parseFloat(row.low).toFixed(8)),
                c: result.map((row) => parseFloat(row.close).toFixed(8)),
                v: result.map((row) => parseFloat(row.volume).toFixed(8)),
            };

            return {
                s: 'ok',
                t: [1723424400, 1723424700, 1723425000], // Ensure these timestamps cover the requested range
                c: [102.5, 104.0, 102], // Closing prices for each interval
                o: [100.0, 102.0, 104.0], // Opening prices for each interval
                h: [105.0, 104.5, 108], // High prices for each interval
                l: [99.0, 101.5, 98], // Low prices for each interval
                v: [1500, 2000, 3000],
            };
        } catch (error) {
            console.log(
                '🚀 ~ file: bond.service.ts:391 ~ BondService ~ getTokenOHCL ~ error:',
                error,
            );
            return {
                s: 'no_data',
            };
        }
    }
}
