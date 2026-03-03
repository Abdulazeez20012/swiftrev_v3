import { Module, Global } from '@nestjs/common';
import { MlService } from './ml.service';
import { HttpModule } from '@nestjs/axios';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
    imports: [
        HttpModule,
        NotificationsModule,
    ],
    providers: [MlService],
    exports: [MlService],
})
export class MlModule { }
