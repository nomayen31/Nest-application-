import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'node_modules/bcryptjs';
import { UpdateUserDto } from './dto/UpdateUser.dto';


@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}

    async register(registerDto: RegisterDto) {
        const { email, password, name } = registerDto;

        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        });

        // Remove password from response
        const { password: _, ...result } = user;
        return result;
    }

    async getAllUsers() {
        const users = await this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return users;
    }

    async getUserById(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto) {
        const { email, password, name } = updateUserDto;

        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        // If email is being updated, check if it's already taken by another user
        if (email && email !== existingUser.email) {
            const emailTaken = await this.prisma.user.findUnique({
                where: { email }
            });

            if (emailTaken) {
                throw new ConflictException('Email is already taken');
            }
        }

        // Prepare update data
        const updateData: any = {};
        
        if (email) updateData.email = email;
        if (name !== undefined) updateData.name = name;
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Update user
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: updateData
        });

        // Remove password from response
        const { password: _, ...result } = updatedUser;
        return result;
    }

    async deleteUser(id: number) {
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        // Delete user
        await this.prisma.user.delete({
            where: { id }
        });

        return { message: 'User deleted successfully', id };
    }
}