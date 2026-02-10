import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  observation?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;
}
