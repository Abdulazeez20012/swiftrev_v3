import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
    constructor(private supabaseService: SupabaseService) { }

    async create(createPatientDto: CreatePatientDto) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('patients')
            .insert([{
                hospital_id: createPatientDto.hospitalId,
                full_name: createPatientDto.fullName,
                phone_number: createPatientDto.phoneNumber,
                email: createPatientDto.email,
                address: createPatientDto.address,
                date_of_birth: createPatientDto.dateOfBirth,
                gender: createPatientDto.gender,
                insurance_number: createPatientDto.insuranceNumber,
                onboarded_by: createPatientDto.onboardedBy,
                patient_type: createPatientDto.patientType || 'regular',
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
            .from('patients')
            .select('*')
            .eq('hospital_id', hospitalId);

        if (error) {
            console.error(`[PatientsService] Error fetching patients for hospital ${hospitalId}:`, error);
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findOne(id: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Patient with ID ${id} not found`);
        }

        return data;
    }

    async update(id: string, updatePatientDto: UpdatePatientDto) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('patients')
            .update({
                full_name: updatePatientDto.fullName,
                phone_number: updatePatientDto.phoneNumber,
                email: updatePatientDto.email,
                address: updatePatientDto.address,
                date_of_birth: updatePatientDto.dateOfBirth,
                gender: updatePatientDto.gender,
                insurance_number: updatePatientDto.insuranceNumber,
                patient_type: updatePatientDto.patientType,
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
            .from('patients')
            .delete()
            .eq('id', id);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Patient removed successfully' };
    }
}
