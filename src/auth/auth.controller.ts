import { Controller, Post, Body, Patch, Param, ParseIntPipe, Get, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // ===================== Get All Users =====================
    @Get('users')
    async getAllUsers() {
        const users = await this.authService.getAllUsers();
        
        return {
            success: true,
            message: users.length > 0 
                ? "Users fetched successfully"
                : "No users found",
            data: users,
        };
    }

    // ===================== Get User By ID =====================
    @Get('user/:id')
    async getUserById(@Param('id', ParseIntPipe) id: number) {
        const user = await this.authService.getUserById(id);

        return {
            success: true,
            message: user 
                ? "User fetched successfully"
                : "User not found",
            data: user,
        };
    }

    // ===================== Register User =====================
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        const user = await this.authService.register(registerDto);

        return {
            success: true,
            message: "User registered successfully",
            data: user,
        };
    }

    // ===================== Update User =====================
    @Patch('user/:id')
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto
    ) {
        const updatedUser = await this.authService.updateUser(id, updateUserDto);

        return {
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        };
    }

    // ===================== Delete User =====================
    @Delete('user/:id')
    async deleteUser(@Param('id', ParseIntPipe) id: number) {
        await this.authService.deleteUser(id);

        return {
            success: true,
            message: "User deleted successfully",
            data: null,
        };
    }
}
