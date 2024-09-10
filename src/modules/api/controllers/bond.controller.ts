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
            banner?: Express.Multer.File[];
        },
        // TODO tokenomics

        @Body('symbol') symbol: string,
        @Body('name') name: string,
        @Body('description') description: string,
        @Body('website') website?: string,
        @Body('twitter') twitter?: string,
        @Body('telegram') telegram?: string,
        @Body('discord') discord?: string,
        @Body('anotherLink1') anotherLink1?: string,
        @Body('anotherLink1') anotherLink2?: string,
    ) {
        return this.bondService.uploadMetadata({
            icon: files.icon[0],
            banner: files.banner?.[0],
            symbol,
            name,
            description,
        });
    }

    @Get('/stats')
    getStats() {
        return this.bondService.getStats();
    }

    @Get('/tokens')
    getTokens(
        @Query('take') take?: number | undefined,
        @Query('skip') skip?: number | undefined,
    ) {
        const _take = take ?? 10;
        const _skip = skip ?? 0;
        return this.bondService.getTokens(_take, _skip);
    }

    @Get('/tokens/:token')
    getToken(@Param('token') token: string) {
        return this.bondService.getToken(token);
    }
}
