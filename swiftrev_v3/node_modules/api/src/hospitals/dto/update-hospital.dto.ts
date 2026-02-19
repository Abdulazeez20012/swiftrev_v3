import { PartialType } from '@nestjs/mapped-types';
import { CreateHospitalDto } from './create-hospital.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateHospitalDto extends PartialType(CreateHospitalDto) {
    @IsString()
    @IsOptional()
    status?: string;
}
