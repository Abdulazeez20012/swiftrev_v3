import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MlService {
    private readonly logger = new Logger(MlService.name);
    private readonly aiServiceUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly supabaseService: SupabaseService,
    ) {
        this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    }

    async checkFraud(transaction: any) {
        try {
            const response = await lastValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/fraud/check`, {
                    amount: transaction.amount,
                    payment_method: transaction.payment_method,
                    patient_id: transaction.patient_id,
                    hospital_id: transaction.hospital_id,
                    revenue_item_id: transaction.revenue_item_id,
                    auth_code: transaction.auth_code,
                    created_at: transaction.created_at,
                }),
            ) as any;

            const prediction = response.data;

            // Save prediction to DB
            const supabase = this.supabaseService.getClient();
            await supabase.from('ml_predictions').insert({
                hospital_id: transaction.hospital_id,
                prediction_type: 'fraud_score',
                entity_id: transaction.id,
                prediction_value: {
                    is_anomaly: prediction.is_anomaly,
                    alert_type: prediction.alert_type,
                    reason: prediction.reason,
                    features: prediction.features_used
                },
                confidence_score: prediction.confidence_score,
            });

            return prediction;
        } catch (error) {
            this.logger.error(`Failed to check fraud: ${error.message}`);
            throw error;
        }
    }

    async getRevenueForecast(hospitalId: string, periods: number = 30) {
        try {
            const response = await lastValueFrom(
                this.httpService.get(`${this.aiServiceUrl}/forecast/revenue/${hospitalId}?periods=${periods}`),
            ) as any;
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to get forecast: ${error.message}`);
            throw error;
        }
    }

    async getRecommendations(hospitalId: string) {
        try {
            const response = await lastValueFrom(
                this.httpService.get(`${this.aiServiceUrl}/recommendations/${hospitalId}`),
            ) as any;
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to get recommendations: ${error.message}`);
            throw error;
        }
    }
}
