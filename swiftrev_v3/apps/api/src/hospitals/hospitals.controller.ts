import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('hospitals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HospitalsController {
    constructor(private readonly hospitalsService: HospitalsService) { }

    @Post()
    @Permissions('hospitals:all')
    create(@Body() createHospitalDto: CreateHospitalDto) {
        return this.hospitalsService.create(createHospitalDto);
    }

    /**
     * GET /hospitals
     * super_admin: returns all hospitals (for the SwiftRev platform dashboard)
     * hospital users: returns only their own hospital (as a single-item array)
     */
    @Get()
    @Permissions('hospitals:read', 'hospitals:all')
    findAll(@CurrentUser() user: any) {
        if (user.role === 'super_admin') {
            return this.hospitalsService.findAll();
        }
        if (!user.hospitalId) {
            throw new ForbiddenException('Your account is not linked to a hospital.');
        }
        return this.hospitalsService.findOne(user.hospitalId).then(h => [h]);
    }

    /**
     * GET /hospitals/:id
     * super_admin: any hospital
     * hospital users: only their own hospital
     */
    @Get(':id')
    @Permissions('hospitals:read', 'hospitals:all')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        if (user.role !== 'super_admin' && user.hospitalId !== id) {
            throw new ForbiddenException('Access denied to this hospital.');
        }
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
