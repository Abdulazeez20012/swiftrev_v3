import { Controller, Get, Post, Body, Param, UseGuards, Query, Req, Patch } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('refunds')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RefundsController {
    constructor(private readonly refundsService: RefundsService) { }

    @Post()
    @Permissions('transactions:all')
    create(@Body() createRefundDto: CreateRefundDto, @Req() req: any) {
        return this.refundsService.create(createRefundDto, req.user.userId);
    }

    @Get()
    @Permissions('transactions:read', 'transactions:all')
    findAll(@Query('hospitalId') hospitalId: string) {
        return this.refundsService.findAllByHospital(hospitalId);
    }

    @Patch(':id/approve')
    @Permissions('hospitals:all') // Only admins can approve refunds
    approve(@Param('id') id: string, @Req() req: any) {
        return this.refundsService.approve(id, req.user.userId);
    }
}
