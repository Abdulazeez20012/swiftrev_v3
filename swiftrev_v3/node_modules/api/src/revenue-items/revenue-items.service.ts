import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateRevenueItemDto } from './dto/create-revenue-item.dto';
import { UpdateRevenueItemDto } from './dto/update-revenue-item.dto';

@Injectable()
export class RevenueItemsService {
    constructor(private supabaseService: SupabaseService) { }

    async create(createRevenueItemDto: CreateRevenueItemDto) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('revenue_items')
            .insert([{
                hospital_id: createRevenueItemDto.hospitalId,
                department_id: createRevenueItemDto.departmentId,
                name: createRevenueItemDto.name,
                description: createRevenueItemDto.description,
                amount: createRevenueItemDto.amount,
            }])
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findAllByHospital(hospitalId: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('revenue_items')
            .select('*, departments(name)')
            .eq('hospital_id', hospitalId);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findOne(id: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('revenue_items')
            .select('*, departments(name)')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Revenue item with ID ${id} not found`);
        }

        return data;
    }

    async update(id: string, updateRevenueItemDto: UpdateRevenueItemDto) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('revenue_items')
            .update({
                department_id: updateRevenueItemDto.departmentId,
                name: updateRevenueItemDto.name,
                description: updateRevenueItemDto.description,
                amount: updateRevenueItemDto.amount,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async remove(id: string) {
        const supabase = this.supabaseService.getClient();
        const { error } = await supabase
            .from('revenue_items')
            .delete()
            .eq('id', id);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Revenue item removed successfully' };
    }
}
