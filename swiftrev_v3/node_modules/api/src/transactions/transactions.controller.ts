import { Controller, Get, Post, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post()
    @Permissions('transactions:all')
    create(@Body() createTransactionDto: CreateTransactionDto, @Req() req: any) {
        return this.transactionsService.create(createTransactionDto, req.user.userId);
    }

    @Get()
    @Permissions('transactions:read', 'transactions:all')
    findAll(@Query('hospitalId') hospitalId: string) {
        return this.transactionsService.findAllByHospital(hospitalId);
    }

    @Get(':id')
    @Permissions('transactions:read', 'transactions:all')
    findOne(@Param('id') id: string) {
        return this.transactionsService.findOne(id);
    }
}
