import { Injectable, BadRequestException } from '@nestjs/common';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';
import { EntityCounterService } from '../../common/services/entity-counter.service';
import { EntityType, Prisma } from '@prisma/client';
import { CreatePureMetalLotDto } from '../dtos/create-pure-metal-lot.dto';
import { PureMetalLotEntity } from '../entities/pure-metal-lot.entity';
import { LotNumberVO } from '../value-objects/lot-number.vo';
import { PureMetalLotMapper } from '../mappers/pure-metal-lot.mapper';

@Injectable()
export class CreatePureMetalLotUseCase {
  constructor(
    private readonly pureMetalLotsRepository: PureMetalLotsRepository,
    private readonly entityCounterService: EntityCounterService,
  ) {}

  async execute(organizationId: string, dto: CreatePureMetalLotDto, externalTx?: any) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID é obrigatório.');
    }

    const {
      initialGrams,
      remainingGrams,
      entryDate,
      clientId,
      supplierId,
      purchaseAmount,
      purchaseDueDate,
      sourceId,
      ...rest
    } = dto;

    const runInTx = async (tx: any) => {
      const nextLotNumber = await this.entityCounterService.getNextNumber(
        EntityType.PURE_METAL_LOT,
        organizationId,
      );
      const lotNumberVO = LotNumberVO.fromSequence(nextLotNumber);
      const finalSourceId = sourceId || (rest.sourceType === 'COMPRA' ? 'COMPRA' : '');

      const lotEntity = PureMetalLotEntity.create({
        ...rest,
        organizationId,
        sourceId: finalSourceId,
        lotNumber: lotNumberVO,
        initialGrams,
        remainingGrams: remainingGrams !== undefined ? remainingGrams : initialGrams,
        entryDate,
      });

      const createdLot = await this.pureMetalLotsRepository.create(lotEntity, tx);

      // Create initial entry movement
      await tx.pureMetalLotMovement.create({
        data: {
          organizationId,
          pureMetalLotId: createdLot.id,
          type: 'ENTRY',
          grams: initialGrams,
          date: createdLot.entryDate,
          notes: createdLot.notes || 'Entrada inicial do lote',
        },
      });

      // Handle Client Advance Credit
      if (rest.sourceType === 'ADIANTAMENTO_CLIENTE' && clientId) {
        const client = await tx.pessoa.findUnique({
          where: { id: clientId, organizationId },
        });

        if (client) {
          let metalAccount = await tx.metalAccount.findFirst({
            where: {
              personId: client.id,
              type: rest.metalType,
              organizationId,
            },
          });

          if (!metalAccount) {
            metalAccount = await tx.metalAccount.create({
              data: {
                organizationId,
                personId: client.id,
                type: rest.metalType,
              },
            });
          }

          await tx.metalAccountEntry.create({
            data: {
              metalAccountId: metalAccount.id,
              date: createdLot.entryDate,
              description: `Adiantamento de Metal - Lote ${lotNumberVO.value}`,
              grams: initialGrams,
              type: 'CREDIT',
              sourceId: createdLot.id,
            },
          });

          await tx.metalCredit.create({
            data: {
              organizationId,
              clientId: client.id,
              metalType: rest.metalType,
              grams: initialGrams,
              date: createdLot.entryDate,
              status: 'PENDING',
              settledGrams: 0,
              pureMetalLotId: createdLot.id,
            },
          });
        }
      }

      // Handle Metal Purchase
      if (rest.sourceType === 'COMPRA' && supplierId && purchaseAmount) {
        const dbSupplier = await tx.pessoa.findUnique({
          where: { id: supplierId },
          include: { fornecedor: true },
        });

        if (dbSupplier && !dbSupplier.fornecedor) {
          await tx.fornecedor.create({
            data: {
              pessoaId: dbSupplier.id,
              organizationId,
            },
          });
        }

        await tx.accountPay.create({
          data: {
            description: `Compra de Metal - Lote ${lotNumberVO.value}`,
            amount: new Prisma.Decimal(purchaseAmount),
            dueDate: purchaseDueDate
              ? new Date(`${purchaseDueDate}T12:00:00`)
              : new Date(),
            organizationId,
            fornecedorId: supplierId,
          },
        });
      }

      return PureMetalLotMapper.toResponseDto(createdLot);
    };

    if (externalTx) {
      return runInTx(externalTx);
    }
    return this.pureMetalLotsRepository.executeInTransaction(runInTx);
  }
}
