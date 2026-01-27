import { Task as PrismaTask, TaskPriority, TaskStatus } from '@prisma/client';

export class Task implements PrismaTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  createdById: string;
}
