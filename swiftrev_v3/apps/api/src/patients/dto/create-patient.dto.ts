import { IsNotEmpty, IsString, IsOptional, IsUUID, IsEmail, IsEnum } from 'class-validator';

export enum PatientType {
    REGULAR = 'regular',
    NHIS = 'nhis',
    RETAINER = 'retainer',
    CAPITATION = 'capitation',
}

export class CreatePatientDto {
    @IsUUID()
    @IsOptional()
    id?: string;

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

    @IsString()
    @IsOptional()
    insuranceNumber?: string;

    @IsUUID()
    @IsOptional()
    onboardedBy?: string;

    @IsEnum(PatientType)
    @IsOptional()
    patientType?: PatientType;

    @IsUUID()
    @IsOptional()
    departmentId?: string;
}
