import { Module } from '@nestjs/common';
import { RevenueItemsService } from './revenue-items.service';
import { RevenueItemsController } from './revenue-items.controller';

@Module({
    controllers: [RevenueItemsController],
    providers: [RevenueItemsService],
    exports: [RevenueItemsService],
})
export class RevenueItemsModule { }
