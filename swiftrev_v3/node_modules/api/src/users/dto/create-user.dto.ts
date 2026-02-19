import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsUUID()
    @IsNotEmpty()
    hospitalId: string;

    @IsUUID()
    @IsNotEmpty()
    roleId: string;

    @IsString()
    @IsOptional()
    fullName?: string;
}
