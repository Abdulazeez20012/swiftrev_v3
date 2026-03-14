import { Controller, Get, Post, Body, Param, UseGuards, Query, Patch } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { HospitalScopeGuard } from '../auth/guards/hospital-scope.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('refunds')
@UseGuards(JwtAuthGuard, PermissionsGuard, HospitalScopeGuard)
export class RefundsController {
    constructor(private readonly refundsService: RefundsService) { }

    @Post()
    @Permissions('transactions:all')
    create(@Body() createRefundDto: CreateRefundDto, @CurrentUser() user: any) {
        return this.refundsService.create(createRefundDto, user.userId);
    }

    @Get()
    @Permissions('transactions:read', 'transactions:all')
    findAll(@CurrentUser() user: any) {
        return this.refundsService.findAllByHospital(user.hospitalId);
    }

    @Patch(':id/approve')
    @Permissions('hospitals:all') // Only admins can approve refunds
    approve(@Param('id') id: string, @CurrentUser() user: any) {
        return this.refundsService.approve(id, user.userId);
    }
}
