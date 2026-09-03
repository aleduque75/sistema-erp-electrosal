import { Injectable, NotFoundException } from '@nestjs/common';
import { MetalCreditsRepository } from '../repositories/metal-credit.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateMetalCreditDto } from '../dtos/update-metal-credit.dto';
import { MetalCreditMapper } from '../mappers/metal-credit.mapper';

@Injectable()
export class UpdateMetalCreditUseCase {
  constructor(
    private readonly metalCreditsRepository: MetalCreditsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, data: UpdateMetalCreditDto, organizationId: string) {
    const credit = await this.metalCreditsRepository.findById(id, organizationId);
    if (!credit) {
      throw new NotFoundException(`Crédito de metal com ID ${id} não encontrado.`);
    }

    if (data.date) {
      credit.updateDate(data.date);
    }

    const updated = await this.metalCreditsRepository.update(credit);

    if (data.date) {
      await this.prisma.metalAccountEntry.updateMany({
        where: {
          sourceId: id,
          type: 'CREDIT',
        },
        data: {
          date: credit.date,
        },
      });
    }

    return MetalCreditMapper.toResponseDto(updated);
  }
}
