import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(private supabaseService: SupabaseService) { }

    async create(createUserDto: CreateUserDto) {
        const supabase = this.supabaseService.getClient();

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', createUserDto.email)
            .single();

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const passwordHash = await bcrypt.hash(createUserDto.password, 10);

        const { data, error } = await supabase
            .from('users')
            .insert([{
                email: createUserDto.email,
                password_hash: passwordHash,
                hospital_id: createUserDto.hospitalId,
                role_id: createUserDto.roleId,
                full_name: createUserDto.fullName,
            }])
            .select('id, email, hospital_id, role_id, full_name, created_at')
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findAllByHospital(hospitalId: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('users')
            .select('id, email, full_name, role_id, roles(name), created_at')
            .eq('hospital_id', hospitalId);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findOne(id: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('users')
            .select('id, email, full_name, hospital_id, role_id, roles(name), created_at')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return data;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const supabase = this.supabaseService.getClient();

        const updateData: any = {
            hospital_id: updateUserDto.hospitalId,
            role_id: updateUserDto.roleId,
            full_name: updateUserDto.fullName,
            status: updateUserDto.status,
            updated_at: new Date().toISOString(),
        };

        if (updateUserDto.password) {
            updateData.password_hash = await bcrypt.hash(updateUserDto.password, 10);
        }

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select('id, email, full_name, hospital_id, role_id, status, updated_at')
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async remove(id: string) {
        const supabase = this.supabaseService.getClient();
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'User removed successfully' };
    }
}
