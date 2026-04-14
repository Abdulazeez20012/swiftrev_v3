import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
    constructor(private supabaseService: SupabaseService) { }

    async create(createDepartmentDto: CreateDepartmentDto) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('departments')
            .insert([{
                hospital_id: createDepartmentDto.hospitalId,
                name: createDepartmentDto.name,
                description: createDepartmentDto.description,
            }])
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findAll() {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('departments')
            .select('*');

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findAllByHospital(hospitalId: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('hospital_id', hospitalId);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findOne(id: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Department with ID ${id} not found`);
        }

        return data;
    }

    async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('departments')
            .update({
                name: updateDepartmentDto.name,
                description: updateDepartmentDto.description,
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
            .from('departments')
            .delete()
            .eq('id', id);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Department removed successfully' };
    }
}
