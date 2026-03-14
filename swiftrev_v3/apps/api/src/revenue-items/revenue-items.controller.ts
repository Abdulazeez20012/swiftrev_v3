import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { RevenueItemsService } from './revenue-items.service';
import { CreateRevenueItemDto } from './dto/create-revenue-item.dto';
import { UpdateRevenueItemDto } from './dto/update-revenue-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { HospitalScopeGuard } from '../auth/guards/hospital-scope.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('revenue-items')
@UseGuards(JwtAuthGuard, PermissionsGuard, HospitalScopeGuard)
export class RevenueItemsController {
    constructor(private readonly revenueItemsService: RevenueItemsService) { }

    @Post()
    @Permissions('revenue_items:all')
    create(@Body() createRevenueItemDto: CreateRevenueItemDto, @CurrentUser() user: any) {
        // Enforce hospitalId from JWT
        createRevenueItemDto.hospitalId = user.hospitalId;
        return this.revenueItemsService.create(createRevenueItemDto);
    }

    @Get()
    @Permissions('revenue_items:read', 'revenue_items:all')
    findAll(
        @CurrentUser() user: any,
        @Query('departmentId') departmentId?: string,
    ) {
        return this.revenueItemsService.findAllByHospital(user.hospitalId, departmentId);
    }

    @Get(':id')
    @Permissions('revenue_items:read', 'revenue_items:all')
    findOne(@Param('id') id: string) {
        return this.revenueItemsService.findOne(id);
    }

    @Patch(':id')
    @Permissions('revenue_items:all')
    update(@Param('id') id: string, @Body() updateRevenueItemDto: UpdateRevenueItemDto) {
        return this.revenueItemsService.update(id, updateRevenueItemDto);
    }

    @Delete(':id')
    @Permissions('revenue_items:all')
    remove(@Param('id') id: string) {
        return this.revenueItemsService.remove(id);
    }
}
