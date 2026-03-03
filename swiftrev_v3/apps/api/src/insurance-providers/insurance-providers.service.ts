import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class InsuranceProvidersService {
    constructor(private supabaseService: SupabaseService) { }

    async findAll() {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('insurance_providers')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findOne(id: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('insurance_providers')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new BadRequestException(`Insurance Provider with ID ${id} not found`);
        }

        return data;
    }
}
