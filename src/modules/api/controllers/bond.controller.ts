import {
    Controller,
    Get,
    Param,
    Post,
    Query,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    ParseFilePipeBuilder,
    HttpStatus,
    ParseFilePipe,
    FileTypeValidator,
    MaxFileSizeValidator,
    Body,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BondService } from '../services';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { GetTokensDto } from '../dto/get-tokens.dto';
import { GetMyTokensDto } from '../dto/get-my-tokens';
import { GetPortfolioTokensDto } from '../dto/get-portfolio-tokens';

@ApiTags('Bond')
@Controller('/bond')
export class BondController {
    constructor(private readonly bondService: BondService) {}

    @Post('/metadata')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'icon', maxCount: 1 },
            { name: 'banner', maxCount: 1 },
        ]),
    )
    uploadMetadata(
        @UploadedFiles()
        files: {
            icon: Express.Multer.File[];
            banner: Express.Multer.File[];
        },
        @Body('symbol') symbol: string,
        @Body('name') name: string,
        @Body('description') description: string,
        @Body('tokenomics') tokenomics?: string,
        @Body('link') link?: string,
    ) {
        return this.bondService.uploadMetadata({
            icon: files.icon[0],
            banner: files.banner?.[0],
            symbol,
            name,
            description,
            tokenomics,
            link,
        });
    }

    @Get('/top-tokens')
    getStats() {
        return this.bondService.getTopTokens();
    }

    @Get('/king-of-hill')
    getKingOfHill() {
        return this.bondService.getKingOfHill();
    }

    @Get('/recent-trades')
    getRecentTrade() {
        return this.bondService.getRecentTrades();
    }

    // @Get('/recent-trades')
    // getRecentTrade() {
    //     return this.bondService.getRecentTrades();
    // }

    @Get('/tokens')
    getTokens(@Query() dto: GetTokensDto) {
        return this.bondService.getTokens(dto);
    }

    @Get('/my-tokens')
    getMyTokens(@Query() dto: GetMyTokensDto) {
        return this.bondService.getMyTokens(dto);
    }

    @Get('/portfolio-tokens')
    getPortfolio(@Query() dto: GetPortfolioTokensDto) {
        return this.bondService.getPortfolioTokens(dto);
    }

    @Get('/tokens/:token')
    getToken(@Param('token') token: string) {
        return this.bondService.getToken(token);
    }

    @Post('/tokens/:token')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'icon', maxCount: 1 },
            { name: 'banner', maxCount: 1 },
        ]),
    )
    updateToken(
        @Param('token') token: string,
        @UploadedFiles()
        files: {
            icon?: Express.Multer.File[];
            banner?: Express.Multer.File[];
        },
        // @Body('signature') signature: string,
        @Body('description') description?: string,
        @Body('link') link?: string,
    ) {
        return this.bondService.updateMetadata({
            token,
            // signature,
            icon: files?.icon?.[0],
            banner: files?.banner?.[0],
            description,
            link,
        });
    }

    @Post('/tokens/:token/comments')
    addComment(
        @Param('token') token: string,
        @Body('user') user: string,
        @Body('content') content: string,
        // @Body('signature') signature: string,
    ) {
        return this.bondService.addComment(token, user, content);
    }
}
