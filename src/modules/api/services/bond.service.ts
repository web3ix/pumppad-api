import { EvmService } from '@/blockchain/services';
import { TradeEntity, TokenEntity, CommentEntity } from '@/database/entities';
import {
    TradeRepository,
    TokenRepository,
    CommentRepository,
} from '@/database/repositories';
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
import base58 from 'bs58';
import nacl from 'tweetnacl';
import {
    EGetTokenAge,
    EGetTokenSortBy,
    GetTokensDto,
} from '../dto/get-tokens.dto';
import { retry } from 'rxjs';
import { GetMyTokensDto } from '../dto/get-my-tokens';
import { GetPortfolioTokensDto } from '../dto/get-portfolio-tokens';

const PRECISION = BigNumber.from('1000000000000000000');

const TARGET_RESERVE = 79.395;

@Injectable()
export class BondService {
    constructor(
        @Inject(EvmService)
        private readonly evmService: EvmService,

        @Inject(TokenRepository)
        private tokenRepo: TokenRepository,

        @Inject(TradeRepository)
        private tradeRepo: TradeRepository,

        @Inject(CommentRepository)
        private commentRepo: CommentRepository,

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

    async getTokens(dto: GetTokensDto): Promise<{
        total: number;
        data: TokenEntity[];
    }> {
        const builder = this.tokenRepo.createQueryBuilder('token');

        const currentTimestamp = Math.floor(Date.now() / 1000);

        if (dto.user) {
            builder.leftJoinAndSelect(
                'token.trades',
                'trade',
                'trade.timestamp >= :timestamp AND trade.doer = :doer',
                {
                    timestamp: currentTimestamp - 86400,
                    doer: dto.user,
                },
            );
        } else {
            builder.leftJoinAndSelect(
                'token.trades',
                'trade',
                'trade.timestamp >= :timestamp',
                {
                    timestamp: currentTimestamp - 86400,
                },
            );
        }

        builder.select([
            'token.id as id',
            'token.token as token',
            'creator',
            'name',
            'symbol',
            'uri',
            'icon',
            'banner',
            'token.desc as desc',
            'link',
            '"lastPrice"',
            'token.reserve as reserve',
            'token."parsedReserve" as "parsedReserve"',
            'token.supplied as supplied',
            'token."parsedSupplied" as "parsedSupplied"',
            'token.timestamp as timestamp',
            'SUM(trade."parseReserveAmount") as volume',
            'COUNT(trade.id) as "totalTrade"',
        ]);

        builder.where('token.activated = true');
        if (dto.user) builder.andWhere('trade.id IS NOT NULL');
        if (dto.search)
            builder.andWhere(
                'LOWER(token.symbol) LIKE LOWER(:search) OR LOWER(token.token) LIKE LOWER(:search)',
                {
                    search: `%${dto.search}%`,
                    token: dto.search,
                },
            );
        if (dto.owner)
            builder.andWhere('token.creator = :creator', {
                creator: dto.owner,
            });
        builder.addGroupBy('token.id');
        builder.addGroupBy('token.token');
        builder.addGroupBy('token.creator');
        builder.addGroupBy('token.name');
        builder.addGroupBy('token.symbol');
        builder.addGroupBy('token.uri');
        builder.addGroupBy('token.icon');
        builder.addGroupBy('token.banner');
        builder.addGroupBy('token.desc');
        builder.addGroupBy('token.link');
        builder.addGroupBy('token.lastPrice');
        builder.addGroupBy('token.timestamp');
        builder.addGroupBy('token.reserve');
        builder.addGroupBy('token."parsedReserve"');
        builder.addGroupBy('token.supplied');
        builder.addGroupBy('token."parsedSupplied"');
        builder.addGroupBy('token.symbol');
        if (dto.sortBy === EGetTokenSortBy.TRENDING) {
            builder.orderBy('volume', 'DESC', 'NULLS LAST');
        } else if (dto.sortBy === EGetTokenSortBy.RAISING) {
            builder.orderBy('"totalTrade"', 'DESC');
        } else if (dto.sortBy === EGetTokenSortBy.NEW) {
            builder.orderBy('timestamp', 'DESC');
        } else if (dto.sortBy === EGetTokenSortBy.TOP) {
            builder.orderBy('"parsedReserve"', 'DESC');
        } else if (dto.sortBy === EGetTokenSortBy.FINISHED) {
            builder.andWhere('token.completed = true');
        }

        if (dto.age === EGetTokenAge.LESS_THAN_1H) {
            builder.andWhere('token.timestamp >= :time', {
                time: currentTimestamp - 3600,
            });
        } else if (dto.age === EGetTokenAge.LESS_THAN_6h) {
            builder.andWhere('token.timestamp >= :time', {
                time: currentTimestamp - 21600,
            });
        } else if (dto.age === EGetTokenAge.LESS_THAN_1D) {
            builder.andWhere('token.timestamp >= :time', {
                time: currentTimestamp - 86400,
            });
        } else if (dto.age === EGetTokenAge.LESS_THAN_1W) {
            builder.andWhere('token.timestamp >= :time', {
                time: currentTimestamp - 604800,
            });
        }

        if (dto.minProgress) {
            builder.andWhere('token."parsedReserve" >= :reserve', {
                reserve: TARGET_RESERVE * +dto.minProgress,
            });
        }

        if (dto.maxProgress) {
            builder.andWhere('token."parsedReserve" <= :reserve', {
                reserve: TARGET_RESERVE * +dto.maxProgress,
            });
        }

        builder.limit(dto.take);
        builder.offset(dto.skip);

        const total = await builder.getCount();

        const tokens = await builder.getRawMany();
        return {
            total,
            data: tokens,
        };
    }

    async getMyTokens(dto: GetMyTokensDto): Promise<{
        total: number;
        data: TokenEntity[];
    }> {
        return this.getTokens({
            sortBy: EGetTokenSortBy.NEW,
            owner: dto.owner,
            take: dto.take,
            skip: dto.skip,
        });
    }

    async getPortfolioTokens(dto: GetPortfolioTokensDto): Promise<{
        total: number;
        data: TokenEntity[];
    }> {
        return this.getTokens({
            sortBy: EGetTokenSortBy.NEW,
            user: dto.user,
            take: dto.take,
            skip: dto.skip,
        });
    }

    async getTopTokens() {
        return this.getTokens({
            sortBy: EGetTokenSortBy.TRENDING,
        });
    }

    async getToken(token: string) {
        const tokens = await this.getTokens({
            search: token,
            take: 1,
            skip: 0,
        });
        if (tokens.total === 0) throw new NotFoundException();

        const _token = tokens.data[0];

        const trades = await this.tradeRepo
            .createQueryBuilder('trade')
            .where('"tokenId" = :tokenId', { tokenId: _token.id })
            .orderBy('timestamp', 'DESC')
            .take(20)
            .skip(0)
            .getMany();

        const comments = await this.commentRepo
            .createQueryBuilder('comment')
            .where('"tokenId" = :tokenId', { tokenId: _token.id })
            .orderBy('timestamp', 'DESC')
            .take(3)
            .skip(0)
            .getMany();

        return {
            ...tokens.data[0],
            trades,
            comments,
        };
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
        return this.getTokens({
            sortBy: EGetTokenSortBy.TOP,
            take: 1,
            skip: 0,
        }).then((res) => res.data?.[0] ?? null);
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

    async updateMetadata({
        token,
        // signature,
        icon,
        banner,
        description,
        link,
    }: {
        token: string;
        // signature: string;
        icon?: Express.Multer.File;
        banner?: Express.Multer.File;
        description?: string;
        link?: string;
    }) {
        let _token = await this.tokenRepo.findOne({
            where: {
                token,
            },
        });

        if (!_token) throw new NotFoundException();

        // const encodedMessage = new TextEncoder().encode(token);
        // const signatureBytes = base58.decode(signature);
        // const publicKeyBytes = base58.decode(_token.creator);
        // // Verify the signature
        // const isValid = nacl.sign.detached.verify(
        //     encodedMessage,
        //     signatureBytes,
        //     publicKeyBytes,
        // );
        // if (!isValid) throw new BadRequestException('Only owner can update');

        let metadata: any = {
            name: _token.name,
            symbol: _token.symbol,
            description: _token.desc,
            image: _token.icon,
            banner: _token.banner,
            link: _token.link,
            tokenomics: _token.tokenomics,
        };

        if (description) {
            metadata.description = description;
            _token.desc = description;
        }

        if (icon) {
            const { url: iconUrl } = await this.s3Service.uploadSingleFile({
                file: icon,
                isPublic: true,
            });
            metadata.image = iconUrl;
            _token.icon = iconUrl;
        }

        if (banner) {
            const { url: bannerUrl } = await this.s3Service.uploadSingleFile({
                file: banner,
                isPublic: true,
            });
            metadata.banner = bannerUrl;
            _token.banner = bannerUrl;
        }

        if (link) {
            metadata.link = link;
            _token.link = JSON.parse(link);
        }

        let key = _token.uri.split('/').slice(-1)[0];

        const { url: metadataUrl } = await this.s3Service.uploadSingleJSON({
            key,
            obj: metadata,
        });
        _token.uri = metadataUrl;

        await this.tokenRepo.update(
            {
                token,
            },
            _token,
        );

        return _token;
    }

    async addComment(
        token: string,
        user: string,
        content: string,
        // signature: string,
    ) {
        // const encodedMessage = new TextEncoder().encode(`${content}${token}`);
        // const signatureBytes = base58.decode(signature);
        // const publicKeyBytes = base58.decode(user);
        // // Verify the signature
        // const isValid = nacl.sign.detached.verify(
        //     encodedMessage,
        //     signatureBytes,
        //     publicKeyBytes,
        // );
        // if (!isValid) throw new BadRequestException('Invalid signature');

        const tokenEntity = await this.tokenRepo.findOne({
            where: { token },
        });
        if (!tokenEntity) throw new NotFoundException('No Token');

        const newComment = new CommentEntity();
        newComment.token = tokenEntity;
        newComment.address = user;
        newComment.text = content;
        newComment.timestamp = Math.floor(Date.now() / 1000);

        await this.socketClient.emitComment(
            newComment.id,
            token,
            newComment.address,
            newComment.text,
            newComment.timestamp,
        );

        return this.commentRepo.save(newComment);
    }
}
