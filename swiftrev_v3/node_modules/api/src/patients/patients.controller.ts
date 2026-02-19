import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    @Post()
    @Permissions('patients:all')
    create(@Body() createPatientDto: CreatePatientDto) {
        return this.patientsService.create(createPatientDto);
    }

    @Get()
    @Permissions('patients:read', 'patients:all')
    findAll(@Query('hospitalId') hospitalId: string) {
        return this.patientsService.findAllByHospital(hospitalId);
    }

    @Get(':id')
    @Permissions('patients:read', 'patients:all')
    findOne(@Param('id') id: string) {
        return this.patientsService.findOne(id);
    }

    @Patch(':id')
    @Permissions('patients:all')
    update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
        return this.patientsService.update(id, updatePatientDto);
    }

    @Delete(':id')
    @Permissions('patients:all')
    remove(@Param('id') id: string) {
        return this.patientsService.remove(id);
    }
}
