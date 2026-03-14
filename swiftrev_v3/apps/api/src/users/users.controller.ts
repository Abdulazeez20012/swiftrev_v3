import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('users')
// @UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('roles')
    // @Permissions('users:all')
    findAllRoles() {
        return this.usersService.findAllRoles();
    }

    @Post()
    @Permissions('users:all')
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @Permissions('users:read', 'users:all')
    findAll(@Query('hospitalId') hospitalId: string) {
        return this.usersService.findAllByHospital(hospitalId);
    }

    @Get(':id')
    @Permissions('users:read', 'users:all')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @Permissions('users:all')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @Permissions('users:all')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
