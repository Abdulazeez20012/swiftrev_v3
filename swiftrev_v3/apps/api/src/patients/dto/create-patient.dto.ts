import { IsNotEmpty, IsString, IsOptional, IsUUID, IsEmail } from 'class-validator';

export class CreatePatientDto {
    @IsUUID()
    @IsNotEmpty()
    hospitalId: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    dateOfBirth?: string;

    @IsString()
    @IsOptional()
    gender?: string;
}
