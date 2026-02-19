import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('wallets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WalletsController {
    constructor(private readonly walletsService: WalletsService) { }

    @Get('hospital/:id')
    @Permissions('hospitals:view')
    findByHospital(@Param('id') id: string) {
        return this.walletsService.findByHospital(id);
    }

    @Get('history/:id')
    @Permissions('hospitals:view')
    getHistory(@Param('id') id: string) {
        return this.walletsService.getTransactionHistory(id);
    }

    @Post('top-up')
    @Permissions('hospitals:manage') // Only Super Admin/High privilege can top up
    topUp(@Body() body: { hospitalId: string, amount: number }, @Request() req: any) {
        return this.walletsService.topUp(body.hospitalId, body.amount, req.user.id);
    }
}
