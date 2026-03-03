import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { InsuranceProvidersService } from './insurance-providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('insurance-providers')
@UseGuards(JwtAuthGuard)
export class InsuranceProvidersController {
    constructor(private readonly insuranceProvidersService: InsuranceProvidersService) { }

    @Get()
    findAll() {
        return this.insuranceProvidersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.insuranceProvidersService.findOne(id);
    }
}
