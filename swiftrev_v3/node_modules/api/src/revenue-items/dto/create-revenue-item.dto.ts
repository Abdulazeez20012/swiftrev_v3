import { IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateRevenueItemDto {
    @IsUUID()
    @IsNotEmpty()
    hospitalId: string;

    @IsUUID()
    @IsNotEmpty()
    departmentId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(0)
    amount: number;
}
