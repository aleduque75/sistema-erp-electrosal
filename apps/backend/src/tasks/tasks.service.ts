import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createTaskDto: CreateTaskDto,
    userId: string,
    organizationId: string,
  ): Promise<Task> {
    return this.prisma.task.create({
      data: {
        ...createTaskDto,
        createdById: userId,
        organizationId: organizationId,
      },
    });
  }

  async findAll(organizationId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { organizationId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    organizationId: string,
  ): Promise<Task> {
    // First, check if the task exists and belongs to the organization
    await this.findOne(id, organizationId);

    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    // First, check if the task exists and belongs to the organization
    await this.findOne(id, organizationId);

    await this.prisma.task.delete({
      where: { id },
    });
  }
}
