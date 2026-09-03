import { Injectable, NotFoundException } from '@nestjs/common';
import { MetalCreditsRepository } from '../repositories/metal-credit.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { MetalCreditMapper } from '../mappers/metal-credit.mapper';

@Injectable()
export class GetMetalCreditByIdUseCase {
  constructor(
    private readonly metalCreditsRepository: MetalCreditsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, organizationId: string) {
    const credit = await this.metalCreditsRepository.findById(id, organizationId);
    if (!credit) {
      throw new NotFoundException(`Crédito de metal com ID ${id} não encontrado.`);
    }

    const client = await this.prisma.pessoa.findUnique({
      where: { id: credit.clientId },
      select: { name: true },
    });

    return MetalCreditMapper.toResponseDto(credit, {
      clientName: client?.name || 'Unknown Client',
    });
  }
}
