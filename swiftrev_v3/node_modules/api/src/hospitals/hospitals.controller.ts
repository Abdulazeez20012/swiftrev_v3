import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('hospitals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HospitalsController {
    constructor(private readonly hospitalsService: HospitalsService) { }

    @Post()
    @Permissions('hospitals:all')
    create(@Body() createHospitalDto: CreateHospitalDto) {
        return this.hospitalsService.create(createHospitalDto);
    }

    @Get()
    @Permissions('hospitals:read', 'hospitals:all')
    findAll() {
        return this.hospitalsService.findAll();
    }

    @Get(':id')
    @Permissions('hospitals:read', 'hospitals:all')
    findOne(@Param('id') id: string) {
        return this.hospitalsService.findOne(id);
    }

    @Patch(':id')
    @Permissions('hospitals:all')
    update(@Param('id') id: string, @Body() updateHospitalDto: UpdateHospitalDto) {
        return this.hospitalsService.update(id, updateHospitalDto);
    }

    @Delete(':id')
    @Permissions('hospitals:all')
    remove(@Param('id') id: string) {
        return this.hospitalsService.remove(id);
    }
}
