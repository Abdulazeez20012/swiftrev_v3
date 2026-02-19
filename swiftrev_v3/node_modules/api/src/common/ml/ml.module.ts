import { Module, Global } from '@nestjs/common';
import { MlService } from './ml.service';
import { MlProcessor } from './ml.processor';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
    imports: [
        HttpModule,
        BullModule.registerQueue({
            name: 'ml-queue',
        }),
        NotificationsModule,
    ],
    providers: [MlService, MlProcessor],
    exports: [MlService],
})
export class MlModule { }
