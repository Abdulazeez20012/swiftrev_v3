import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateDepartmentDto {
    @IsUUID()
    @IsNotEmpty()
    hospitalId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}
