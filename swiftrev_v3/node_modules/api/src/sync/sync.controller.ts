import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncTransactionsDto } from './dto/sync-transactions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
    constructor(private readonly syncService: SyncService) { }

    @Post('transactions')
    syncTransactions(@Body() syncDto: SyncTransactionsDto, @Req() req: any) {
        return this.syncService.syncTransactions(syncDto, req.user.userId);
    }
}
