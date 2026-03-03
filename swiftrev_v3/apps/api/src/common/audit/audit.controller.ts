import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    @Permissions('audit:read', 'admin:all')
    findAll(@Query('hospitalId') hospitalId: string) {
        return this.auditService.findAllByHospital(hospitalId);
    }
}
