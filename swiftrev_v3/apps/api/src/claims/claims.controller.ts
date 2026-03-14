import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HospitalScopeGuard } from '../auth/guards/hospital-scope.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('claims')
@UseGuards(JwtAuthGuard, HospitalScopeGuard)
export class ClaimsController {
    constructor(private readonly claimsService: ClaimsService) { }

    @Get()
    async getPending(
        @CurrentUser() user: any,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number
    ) {
        return this.claimsService.findPendingClaims(
            user.hospitalId,
            limit ? Number(limit) : 20,
            offset ? Number(offset) : 0
        );
    }

    @Get('stats')
    async getStats(@CurrentUser() user: any) {
        return this.claimsService.getStats(user.hospitalId);
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
