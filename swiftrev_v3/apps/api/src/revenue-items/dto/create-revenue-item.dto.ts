import { IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, IsEnum, Min } from 'class-validator';

export enum PaymentType {
    CASH = 'cash',
    NHIS = 'nhis',
    CAPITATION = 'capitation',
    RETAINERSHIP = 'retainership',
}

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

    @IsEnum(PaymentType)
    @IsOptional()
    paymentType?: PaymentType;

    @IsNumber()
    @Min(0)
    @IsOptional()
    nhisAmount?: number;
}
