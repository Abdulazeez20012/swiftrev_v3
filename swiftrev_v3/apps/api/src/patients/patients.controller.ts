import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { HospitalScopeGuard } from '../auth/guards/hospital-scope.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard, PermissionsGuard, HospitalScopeGuard)
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    @Post()
    @Permissions('patients:all')
    create(@Body() createPatientDto: CreatePatientDto, @CurrentUser() user: any) {
        // Enforce hospital from JWT — don't trust the body's hospitalId
        createPatientDto.hospitalId = user.hospitalId;
        return this.patientsService.create(createPatientDto);
    }

    /**
     * GET /patients — HospitalScopeGuard has already overridden req.query.hospitalId
     * with the JWT value, so user.hospitalId is always the correct hospital.
     */
    @Get()
    @Permissions('patients:read', 'patients:all')
    findAll(
        @CurrentUser() user: any,
        @Query('hospitalId') hospitalId?: string,
    ) {
        return this.patientsService.findAllByHospital(user.hospitalId);
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
