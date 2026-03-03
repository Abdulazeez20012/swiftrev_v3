import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(private supabaseService: SupabaseService) { }

    async log(action: string, module: string, userId: string, hospitalId: string, details: any = {}) {
        const supabase = this.supabaseService.getClient();

        const { error } = await supabase
            .from('audit_logs')
            .insert([{
                action,
                module,
                user_id: userId,
                hospital_id: hospitalId,
                details,
            }]);

        if (error) {
            this.logger.error(`Failed to create audit log: ${error.message}`);
        }
    }

    async findAllByHospital(hospitalId: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*, users(email)')
            .eq('hospital_id', hospitalId)
            .order('created_at', { ascending: false });

        return data;
    }
}
