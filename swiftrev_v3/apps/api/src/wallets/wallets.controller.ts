import { Controller, Get, Post, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { HospitalScopeGuard } from '../auth/guards/hospital-scope.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('wallets')
@UseGuards(JwtAuthGuard, PermissionsGuard, HospitalScopeGuard)
export class WalletsController {
    constructor(private readonly walletsService: WalletsService) { }

    @Get('hospital/:id')
    @Permissions('hospitals:view')
    findByHospital(@Param('id') id: string, @CurrentUser() user: any) {
        if (user.role !== 'super_admin' && user.hospitalId !== id) {
            throw new ForbiddenException('Access denied to this wallet.');
        }
        return this.walletsService.findByHospital(id);
    }

    @Get('history/:id')
    @Permissions('hospitals:view')
    getHistory(@Param('id') id: string, @CurrentUser() user: any) {
        if (user.role !== 'super_admin' && user.hospitalId !== id) {
            throw new ForbiddenException('Access denied to this history.');
        }
        return this.walletsService.getTransactionHistory(id);
    }

    @Post('top-up')
    @Permissions('hospitals:manage') // Only Super Admin/High privilege can top up
    topUp(@Body() body: { hospitalId: string, amount: number, agentId?: string }, @CurrentUser() user: any) {
        // Enforce hospitalId if not super_admin
        const targetHospitalId = user.role === 'super_admin' ? body.hospitalId : user.hospitalId;
        return this.walletsService.topUp(targetHospitalId, body.amount, body.agentId);
    }
}
