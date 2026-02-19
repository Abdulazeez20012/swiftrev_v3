import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';

@Injectable()
export class HospitalsService {
    constructor(private supabaseService: SupabaseService) { }

    async create(createHospitalDto: CreateHospitalDto) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('hospitals')
            .insert([{
                name: createHospitalDto.name,
                address: createHospitalDto.address,
                contact_info: createHospitalDto.contactInfo,
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
            .from('hospitals')
            .select('*');

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findOne(id: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('hospitals')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Hospital with ID ${id} not found`);
        }

        return data;
    }

    async update(id: string, updateHospitalDto: UpdateHospitalDto) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('hospitals')
            .update({
                name: updateHospitalDto.name,
                address: updateHospitalDto.address,
                contact_info: updateHospitalDto.contactInfo,
                status: updateHospitalDto.status,
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
            .from('hospitals')
            .delete()
            .eq('id', id);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Hospital removed successfully' };
    }
}
