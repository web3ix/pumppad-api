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

    @Get('/tokens')
    getTokens(
        @Query('take') take?: number,
        @Query('skip') skip?: number,
        @Query('type') type?: string,
        @Query('owner') owner?: string,
        @Query('age') age?: number,
        @Query('minProgress') minProgress?: number,
        @Query('maxProgress') maxProgress?: number,
        @Query('search') search?: number,
    ) {
        const _take = !isNaN(take) ? take : 10;
        const _skip = !isNaN(skip) ? skip : 0;
        return this.bondService.getTokens(
            _take,
            _skip,
            type,
            age,
            minProgress,
            maxProgress,
            owner,
        );
    }

    @Get('/tokens/:token')
    getToken(@Param('token') token: string) {
        return this.bondService.getToken(token);
    }
}
