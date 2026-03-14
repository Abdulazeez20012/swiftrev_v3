import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('claims')
@UseGuards(JwtAuthGuard)
export class ClaimsController {
    constructor(private readonly claimsService: ClaimsService) { }

    @Get()
    async getPending(
        @Req() req: any,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number
    ) {
        return this.claimsService.findPendingClaims(
            req.user.hospitalId,
            limit ? Number(limit) : 20,
            offset ? Number(offset) : 0
        );
    }

    @Get('stats')
    async getStats(@Req() req: any) {
        return this.claimsService.getStats(req.user.hospitalId);
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        return this.claimsService.getClaimById(id);
    }

    @Post(':id/settle')
    async settle(
        @Param('id') id: string,
        @Body('reference') reference: string
    ) {
        return this.claimsService.settleClaim(id, reference);
    }

    @Post(':id/reject')
    async reject(
        @Param('id') id: string,
        @Body('reason') reason: string
    ) {
        return this.claimsService.rejectClaim(id, reason);
    }
}
