import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('revenue-summary')
    @Permissions('reports:view')
    async getRevenueSummary(
        @Query('hospitalId') hospitalId: string,
        @Query('timeframe') timeframe: 'daily' | 'weekly' | 'monthly' = 'daily',
    ) {
        return this.reportsService.getRevenueSummary(hospitalId, timeframe);
    }

    @Get('agent-performance')
    @Permissions('reports:view')
    async getAgentPerformance(@Query('hospitalId') hospitalId: string) {
        return this.reportsService.getAgentPerformance(hospitalId);
    }
}
