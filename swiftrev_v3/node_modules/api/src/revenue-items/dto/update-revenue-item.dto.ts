import { PartialType } from '@nestjs/mapped-types';
import { CreateRevenueItemDto } from './create-revenue-item.dto';

export class UpdateRevenueItemDto extends PartialType(CreateRevenueItemDto) { }
