import { EvmService } from '@/blockchain/services';
import { TradeEntity, TokenEntity } from '@/database/entities';
import { TradeRepository, TokenRepository } from '@/database/repositories';
import { PumpAbi } from '@/shared/blockchain/abis';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { BigNumber, ethers } from 'ethers';

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
        return this.tokenRepo.update(
            {
                token,
                activated: false,
            },
            {
                activated: true,
                stepId: stepId,
            },
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

        await this.tradeRepo.manager.transaction(
            async (transactionalEntityManager) => {
                await this.tradeRepo.save(buyEvent);
                await this.tokenRepo.update(
                    { token },
                    {
                        lastPrice: +ethers.utils.formatUnits(
                            BigNumber.from(reserveAmount)
                                .mul(PRECISION)
                                .div(BigNumber.from(amount)),
                            18,
                        ),
                    },
                );
            },
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

        await this.tradeRepo.manager.transaction(
            async (transactionalEntityManager) => {
                await this.tradeRepo.save(sellEvent);
                await this.tokenRepo.update(
                    { token },
                    {
                        lastPrice: +ethers.utils.formatUnits(
                            BigNumber.from(reserveAmount)
                                .mul(PRECISION)
                                .div(BigNumber.from(amount)),
                            18,
                        ),
                    },
                );
            },
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
                updatedAt: 'DESC',
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
}
