import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dtos/create-user.dto'; // Importe o UpdateUserDto
import * as bcrypt from 'bcryptjs';
import { User, UserSettings } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // A criação de um usuário AGORA também cria uma Organização
    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        role: createUserDto.role,
        password: hashedPassword,
        // Cria uma nova organização para este novo usuário
        organization: {
          create: {
            name: `Empresa de ${createUserDto.name}`, // Nome padrão
          },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdAndOrganization(
    id: string,
    organizationId: string,
    include?: any,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, organizationId },
      include,
    });
  }

  // --- 👇 MÉTODOS FALTANTES ADICIONADOS AQUI 👇 ---
  async findAll(organizationId: string): Promise<User[]> {
    return this.prisma.user.findMany({ where: { organizationId } });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    organizationId: string,
  ): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    return this.prisma.user.update({
      where: { id, organizationId },
      data: updateUserDto,
    });
  }

  async remove(id: string, organizationId: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id, organizationId },
    });
  }

  async getUserSettingsByOrganizationId(
    organizationId: string,
  ): Promise<UserSettings | null> {
    const user = await this.prisma.user.findFirst({
      where: { organizationId },
      include: { settings: true },
    });
    return user?.settings || null;
  }
}
