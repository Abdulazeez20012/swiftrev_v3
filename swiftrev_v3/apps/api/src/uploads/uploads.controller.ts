import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, UseGuards, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) { }

    @Post('profile')
    @UseInterceptors(FileInterceptor('file'))
    async uploadProfile(
        @UploadedFile() file: Express.Multer.File,
        @Query('type') type: 'hospital' | 'user'
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const bucket = 'profiles';
        const pathPrefix = type === 'hospital' ? 'hospitals' : 'avatars';

        return this.uploadsService.uploadFile(file, bucket, pathPrefix);
    }
}
