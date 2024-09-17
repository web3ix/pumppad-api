import { EvmService } from '@/blockchain/services';
import { TradeEntity, TokenEntity } from '@/database/entities';
import { TradeRepository, TokenRepository } from '@/database/repositories';
import { PumpAbi } from '@/shared/blockchain/abis';
import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { BigNumber, ethers } from 'ethers';
import { SocketService } from './socket.service';
import { Between, LessThan } from 'typeorm';
import { S3Service } from './s3.service';

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

        private readonly s3Service: S3Service,
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

        const res = await fetch(uri);
        const metadata = await res.json();

        if (!metadata.image || !metadata.banner || !metadata.description)
            return;

        const newToken = new TokenEntity();
        newToken.token = token;
        newToken.creator = creator;
        newToken.activated = false;
        newToken.name = name;
        newToken.symbol = symbol;
        newToken.uri = uri;
        newToken.timestamp = timestamp;
        newToken.supplied = '0';
        newToken.reserve = '0';
        newToken.parsedSupplied = 0;
        newToken.parsedReserve = 0;
        newToken.lastPrice = 0.000000013;
        newToken.icon = metadata.image;
        newToken.banner = metadata.banner;
        newToken.desc = metadata.description;

        if (metadata.link) {
            newToken.link = JSON.parse(metadata.link);
        }

        if (metadata.tokenomics) {
            newToken.tokenomics = JSON.parse(metadata.tokenomics);
        }

        return this.tokenRepo.save(newToken);
    }

    async activateToken(token: string) {
        const _token = await this.tokenRepo.findOne({
            where: {
                token,
                activated: false,
            },
        });

        if (!_token) return;

        await this.tokenRepo.update(
            {
                token,
                activated: false,
            },
            {
                activated: true,
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
        totalSupply: string,
        totalReserve: string,
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
        const parsedTotalReserve = +ethers.utils.formatUnits(totalReserve, 9);
        const parsedTotalSupplied = +ethers.utils.formatUnits(totalSupply, 9);
        await this.tradeRepo.manager.transaction(
            async (transactionalEntityManager) => {
                trade = await this.tradeRepo.save(buyEvent);
                await this.tokenRepo.update(
                    { token },
                    {
                        lastPrice,
                        reserve: totalReserve,
                        supplied: totalSupply,
                        parsedReserve: parsedTotalReserve,
                        parsedSupplied: parsedTotalSupplied,
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
            totalSupply,
            totalReserve,
            parsedTotalSupplied,
            parsedTotalReserve,
        );
    }

    async createSellEvent(
        signature: string,
        token: string,
        seller: string,
        amount: string,
        reserveAmount: string,
        totalSupply: string,
        totalReserve: string,
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
        const parsedTotalReserve = +ethers.utils.formatUnits(totalReserve, 9);
        const parsedTotalSupplied = +ethers.utils.formatUnits(totalSupply, 9);
        await this.tradeRepo.manager.transaction(
            async (transactionalEntityManager) => {
                trade = await this.tradeRepo.save(sellEvent);
                await this.tokenRepo.update(
                    { token },
                    {
                        lastPrice,
                        reserve: totalReserve,
                        supplied: totalSupply,
                        parsedReserve: parsedTotalReserve,
                        parsedSupplied: parsedTotalSupplied,
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
            totalSupply,
            totalReserve,
            parsedTotalSupplied,
            parsedTotalReserve,
        );
    }

    async getTokens(
        take: number = 10,
        skip: number = 0,
        type?: string,
        age?: number,
        minProgress?: number,
        maxProgress?: number,
        owner?: string,
    ) {
        return this.tokenRepo.find({
            where: owner
                ? {
                      creator: owner,
                      activated: true,
                  }
                : {
                      activated: true,
                  },
            order: {
                updatedAt: 'DESC',
            },
            select: [
                'id',
                'token',
                'creator',
                'name',
                'symbol',
                'uri',
                'icon',
                'banner',
                'desc',
                'link',
                'trades',
                'lastPrice',
                'timestamp',
                'supplied',
                'reserve',
                'parsedSupplied',
                'parsedReserve',
            ],
            take,
            skip,
        });
    }

    async getTopTokens() {
        return this.tokenRepo.find({
            where: {
                activated: true,
            },
            order: {
                updatedAt: 'DESC',
                parsedReserve: 'DESC',
            },
            select: [
                'id',
                'token',
                'creator',
                'name',
                'symbol',
                'uri',
                'icon',
                'banner',
                'desc',
                'link',
                'trades',
                'lastPrice',
                'timestamp',
                'supplied',
                'reserve',
                'parsedSupplied',
                'parsedReserve',
            ],
            take: 10,
            skip: 0,
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
                    'creator',
                    'name',
                    'symbol',
                    'uri',
                    'icon',
                    'banner',
                    'desc',
                    'link',
                    'trades',
                    'lastPrice',
                    'timestamp',
                    'supplied',
                    'reserve',
                    'parsedSupplied',
                    'parsedReserve',
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
        return this.tokenRepo.findOne({
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
                'icon',
                'banner',
                'desc',
                'link',
                'trades',
                'lastPrice',
                'timestamp',
                'supplied',
                'reserve',
                'parsedSupplied',
                'parsedReserve',
            ],
        });
    }

    async getRecentTrades() {
        return this.tradeRepo.find({
            order: {
                timestamp: 'DESC',
            },
            relations: {
                token: true,
            },
            select: [
                'id',
                'token',
                'isBuy',
                'doer',
                'amount',
                'parseAmount',
                'reserveAmount',
                'parseAmount',
                'parseReserveAmount',
                'timestamp',
            ],
            take: 10,
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

    async getTokenOHCL(
        symbol: string,
        from: number,
        to: number,
        resolution: string,
    ) {
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
                    time,
                    MIN("parseReserveAmount" / "parseAmount") AS low, 
                    MAX("parseReserveAmount" / "parseAmount") AS high,
                    COALESCE(LAG(close) OVER (ORDER BY time), open) AS open,
                    MIN(close) as close,
                    SUM("parseReserveAmount") as volume
                FROM (
                    select
                        FLOOR(EXTRACT(EPOCH FROM to_timestamp("timestamp")) / 300) * 300 AS time, 
                        "parseReserveAmount", 
                        "parseAmount",
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

                GROUP BY time, open, close
                ORDER BY time asc

                `,
            );

            //   // Transform the result into TradingView's expected format
            return {
                s: 'ok',
                t: result.map((row) => row.time),
                o: result.map((row) => row.open),
                h: result.map((row) => row.high),
                l: result.map((row) => row.low),
                c: result.map((row) => row.close),
                // v: result.map((row) => parseFloat(row.volume).toFixed(8)),
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

    async uploadMetadata({
        icon,
        banner,
        symbol,
        name,
        description,
        tokenomics,
        link,
    }: {
        icon: Express.Multer.File;
        banner: Express.Multer.File;
        symbol: string;
        name: string;
        description: string;
        tokenomics?: string;
        link?: string;
    }) {
        if (!icon || !banner || !symbol || !name || !description)
            throw new BadRequestException('Invalid required fields');

        let metadata: any = {
            name,
            symbol,
            description,
        };

        const { url: iconUrl } = await this.s3Service.uploadSingleFile({
            file: icon,
            isPublic: true,
        });

        metadata.image = iconUrl;

        const { url: bannerUrl } = await this.s3Service.uploadSingleFile({
            file: banner,
            isPublic: true,
        });

        metadata.banner = bannerUrl;

        if (link) {
            metadata.link = link;
        }

        if (tokenomics) {
            metadata.tokenomics = tokenomics;
        }

        const { url: metadataUrl } = await this.s3Service.uploadSingleJSON({
            obj: metadata,
        });
        return metadataUrl;
    }
}
