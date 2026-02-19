import { IsArray, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTransactionDto } from '../../transactions/dto/create-transaction.dto';

export class SyncTransactionsDto {
    @IsUUID()
    @IsNotEmpty()
    hospitalId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTransactionDto)
    transactions: CreateTransactionDto[];
}
