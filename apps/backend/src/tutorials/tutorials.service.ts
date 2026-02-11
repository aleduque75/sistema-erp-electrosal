/*
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTutorialDto } from './dto/create-tutorial.dto';
import { UpdateTutorialDto } from './dto/update-tutorial.dto';

@Injectable()
export class TutorialsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createTutorialDto: CreateTutorialDto) {
    return this.prisma.tutorial.create({
      data: createTutorialDto,
    });
  }

  findAll() {
    return this.prisma.tutorial.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(slug: string) {
    return this.prisma.tutorial.findUnique({
      where: { slug },
    });
  }

  findOneById(id: string) {
    return this.prisma.tutorial.findUnique({
      where: { id },
    });
  }

  update(id: string, updateTutorialDto: UpdateTutorialDto) {
    return this.prisma.tutorial.update({
      where: { id },
      data: updateTutorialDto,
    });
  }

  remove(id: string) {
    return this.prisma.tutorial.delete({
      where: { id },
    });
  }
}
*/
