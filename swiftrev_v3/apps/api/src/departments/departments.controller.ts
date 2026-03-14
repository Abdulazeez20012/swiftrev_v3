import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { HospitalScopeGuard } from '../auth/guards/hospital-scope.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('departments')
@UseGuards(JwtAuthGuard, PermissionsGuard, HospitalScopeGuard)
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) { }

    @Post()
    @Permissions('departments:all')
    create(@Body() createDepartmentDto: CreateDepartmentDto, @CurrentUser() user: any) {
        createDepartmentDto.hospitalId = user.hospitalId;
        return this.departmentsService.create(createDepartmentDto);
    }

    @Get()
    @Permissions('departments:read', 'departments:all')
    findAll(@CurrentUser() user: any) {
        return this.departmentsService.findAllByHospital(user.hospitalId);
    }

    @Get(':id')
    @Permissions('departments:read', 'departments:all')
    findOne(@Param('id') id: string) {
        return this.departmentsService.findOne(id);
    }

    @Patch(':id')
    @Permissions('departments:all')
    update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
        return this.departmentsService.update(id, updateDepartmentDto);
    }

    @Delete(':id')
    @Permissions('departments:all')
    remove(@Param('id') id: string) {
        return this.departmentsService.remove(id);
    }
}
