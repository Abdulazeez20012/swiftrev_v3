import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateHospitalDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    contactInfo?: string;
}
