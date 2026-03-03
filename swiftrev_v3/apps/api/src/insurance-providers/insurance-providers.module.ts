import { Module } from '@nestjs/common';
import { InsuranceProvidersService } from './insurance-providers.service';
import { InsuranceProvidersController } from './insurance-providers.controller';

@Module({
    providers: [InsuranceProvidersService],
    controllers: [InsuranceProvidersController],
    exports: [InsuranceProvidersService],
})
export class InsuranceProvidersModule { }
