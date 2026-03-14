import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { HospitalScopeGuard } from '../auth/guards/hospital-scope.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard, HospitalScopeGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('revenue-summary')
    @Permissions('reports:view')
    async getRevenueSummary(
        @CurrentUser() user: any,
        @Query('timeframe') timeframe: 'daily' | 'weekly' | 'monthly' = 'daily',
    ) {
        return this.reportsService.getRevenueSummary(user.hospitalId, timeframe);
    }

    @Get('agent-performance')
    @Permissions('reports:view')
    async getAgentPerformance(@CurrentUser() user: any) {
        return this.reportsService.getAgentPerformance(user.hospitalId);
    }
}
