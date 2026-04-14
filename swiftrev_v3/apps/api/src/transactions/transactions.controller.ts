import { Controller, Get, Post, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { HospitalScopeGuard } from '../auth/guards/hospital-scope.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard, PermissionsGuard, HospitalScopeGuard)
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post()
    @Permissions('transactions:all')
    create(@Body() createTransactionDto: CreateTransactionDto, @Req() req: any) {
        return this.transactionsService.create(createTransactionDto, req.user.userId);
    }

    @Get()
    @Permissions('transactions:read', 'transactions:all')
    findAll(
        @CurrentUser() user: any,
        @Query('status') status?: string,
        @Query('paymentMethod') paymentMethod?: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
        @Query('agentId') agentId?: string,
        @Query('hospitalId') hospitalId?: string,
    ) {
        const targetAgentId = agentId === 'undefined' ? undefined : agentId;
        return this.transactionsService.findAllByHospital(user.hospitalId, status, paymentMethod, limit, offset, targetAgentId);
    }

    @Get(':id')
    @Permissions('transactions:read', 'transactions:all')
    findOne(@Param('id') id: string) {
        return this.transactionsService.findOne(id);
    }
}
