import { IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateTransactionDto {
    @IsUUID()
    @IsNotEmpty()
    hospitalId: string;

    @IsUUID()
    @IsNotEmpty()
    patientId: string;

    @IsUUID()
    @IsNotEmpty()
    revenueItemId: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsString()
    @IsNotEmpty()
    paymentMethod: string;

    @IsString()
    @IsOptional()
    paymentReference?: string;

    @IsUUID()
    @IsOptional()
    offlineId?: string; // For syncing transactions created offline
}
