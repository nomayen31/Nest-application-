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
import { 
    ApiOperation, 
    ApiTags, 
    ApiBody, 
    ApiResponse, 
    ApiBearerAuth 
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // ===================== Register User (Public) =====================
    @Post('register')
    @ApiOperation({ summary: 'Register a user' })
    @ApiBody({
        type: RegisterDto,
        schema: {
            example: {
                email: "ohin@example.com",
                password: "P@ssw0rd!",
                name: "Ohin"
            }
        }
    })
    @ApiResponse({
        status: 201,
        description: 'User registered successfully',
        schema: {
            example: {
                success: true,
                message: "User registered successfully",
                data: {
                    id: 1,
                    email: "ohin@example.com",
                    name: "Ohin",
                    createdAt: "2025-11-28T12:00:00.000Z"
                }
            }
        }
    })
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
    @ApiOperation({ summary: 'Login user' })
    @ApiBody({
        type: LoginDto,
        schema: {
            example: {
                email: "ohin@example.com",
                password: "P@ssw0rd!"
            }
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
        schema: {
            example: {
                success: true,
                message: "Login successful",
                data: {
                    access_token: "eyJhbGciOiJIUzI1NiIsInR..."
                }
            }
        }
    })
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
    @ApiBearerAuth()
    @Get('users')
    @ApiOperation({ summary: 'Fetch all users' })
    @ApiResponse({
        status: 200,
        description: 'List of all users',
        schema: {
            example: {
                success: true,
                message: "Users fetched successfully",
                data: [
                    {
                        id: 1,
                        email: "ohin@example.com",
                        name: "Ohin",
                        createdAt: "2025-11-28T12:00:00.000Z"
                    }
                ]
            }
        }
    })
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
    @ApiBearerAuth()
    @Get('user/:id')
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({
        status: 200,
        description: 'User details',
        schema: {
            example: {
                success: true,
                message: "User fetched successfully",
                data: {
                    id: 1,
                    email: "ohin@example.com",
                    name: "Ohin",
                    createdAt: "2025-11-28T12:00:00.000Z"
                }
            }
        }
    })
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
    @ApiBearerAuth()
    @Patch('user/:id')
    @ApiOperation({ summary: 'Update user details' })
    @ApiBody({
        type: UpdateUserDto,
        schema: {
            example: {
                email: "newmail@example.com",
                password: "NewPass123!",
                name: "Updated Ohin"
            }
        }
    })
    @ApiResponse({
        status: 200,
        description: 'User updated successfully',
        schema: {
            example: {
                success: true,
                message: "User updated successfully",
                data: {
                    id: 1,
                    email: "newmail@example.com",
                    name: "Updated Ohin",
                    updatedAt: "2025-11-28T12:05:00.000Z"
                }
            }
        }
    })
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
    @ApiBearerAuth()
    @Delete('user/:id')
    @ApiOperation({ summary: 'Delete user' })
    @ApiResponse({
        status: 200,
        description: 'User deleted successfully',
        schema: {
            example: {
                success: true,
                message: "User deleted successfully",
                data: null
            }
        }
    })
    async deleteUser(@Param('id', ParseIntPipe) id: number) {
        await this.authService.deleteUser(id);

        return {
            success: true,
            message: "User deleted successfully",
            data: null,
        };
    }
}
