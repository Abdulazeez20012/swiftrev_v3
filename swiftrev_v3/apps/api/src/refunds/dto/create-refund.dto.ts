import { IsNotEmpty, IsString, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateRefundDto {
    @IsUUID()
    @IsNotEmpty()
    transactionId: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsString()
    @IsNotEmpty()
    reason: string;
}
