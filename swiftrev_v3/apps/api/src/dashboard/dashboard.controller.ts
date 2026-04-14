import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { HospitalScopeGuard } from '../auth/guards/hospital-scope.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard, HospitalScopeGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('agent')
    @Permissions('transactions:view') // Agents have transaction permissions
    async getAgentDashboard(
        @CurrentUser() user: any,
        @Query('agentId') agentId?: string,
        @Query('hospitalId') hospitalId?: string,
    ) {
        const targetAgentId = (agentId && agentId !== 'undefined') ? agentId : user.userId;
        return this.dashboardService.getAgentStats(user.hospitalId, targetAgentId);
    }
}
