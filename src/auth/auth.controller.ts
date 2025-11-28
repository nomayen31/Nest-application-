import { 
    Controller, 
    Post, 
    Body, 
    Patch, 
    Param, 
    ParseIntPipe, 
    Get, 
    Delete,
    UseGuards 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // ===================== Register User (Public) =====================
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        const result = await this.authService.register(registerDto);

        return {
            success: true,
            message: "User registered successfully",
            data: result,
        };
    }

    // ===================== Login User (Public) =====================
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        const result = await this.authService.login(loginDto);

        return {
            success: true,
            message: "Login successful",
            data: result,
        };
    }

    // ===================== Get All Users (Protected) =====================
    @UseGuards(JwtAuthGuard)
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

    // ===================== Get User By ID (Protected) =====================
    @UseGuards(JwtAuthGuard)
    @Get('user/:id')
    async getUserById(@Param('id', ParseIntPipe) id: number) {
        const user = await this.authService.getUserById(id);

        return {
            success: true,
            message: "User fetched successfully",
            data: user,
        };
    }

    // ===================== Update User (Protected) =====================
    @UseGuards(JwtAuthGuard)
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

    // ===================== Delete User (Protected) =====================
    @UseGuards(JwtAuthGuard)
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