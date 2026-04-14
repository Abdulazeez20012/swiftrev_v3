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

        // 1. Create user in Supabase Auth first (using service role)
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: createUserDto.email,
            password: createUserDto.password,
            email_confirm: true,
            user_metadata: {
                full_name: createUserDto.fullName,
            }
        });

        if (authError) {
            // If user already exists in Auth, we might still want to create the public profile 
            // but for now we follow strict invite flow.
            if (authError.message.includes('already registered')) {
                throw new ConflictException('User with this email is already registered in Auth');
            }
            throw new BadRequestException(`Auth Error: ${authError.message}`);
        }

        // 2. Insert into our public users table
        const { data, error } = await supabase
            .from('users')
            .insert([{
                id: authUser.user.id, // Link to the Auth ID
                email: createUserDto.email,
                hospital_id: createUserDto.hospitalId || null,
                role_id: createUserDto.roleId,
                full_name: createUserDto.fullName,
            }])
            .select('id, email, hospital_id, role_id, full_name, created_at')
            .single();

        if (error) {
            // Rollback Auth user if public profile creation fails
            await supabase.auth.admin.deleteUser(authUser.user.id);
            throw new BadRequestException(`Database Error: ${error.message}`);
        }

        return data;
    }

    async findAllByHospital(hospitalId?: string) {
        const supabase = this.supabaseService.getClient();
        let query = supabase
            .from('users')
            .select('id, email, full_name, hospital_id, role_id, roles(name), created_at');

        if (hospitalId) {
            query = query.eq('hospital_id', hospitalId);
        }

        const { data, error } = await query;

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findAllRoles() {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('roles')
            .select('id, name');

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
            avatar_url: updateUserDto.avatar_url,
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
