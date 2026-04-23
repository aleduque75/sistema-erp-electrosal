import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePureMetalLotDto } from './dto/create-pure-metal-lot.dto';
import { UpdatePureMetalLotDto } from './dto/update-pure-metal-lot.dto';
import { SellPureMetalLotDto } from './dto/sell-pure-metal-lot.dto';
import { PureMetalLotsRepository } from './pure-metal-lots.repository';
import { EntityCounterService } from '../common/services/entity-counter.service';
import { EntityType, TipoMetal, Prisma } from '@prisma/client'; // Adicionado Prisma
import { PrismaService } from '../prisma/prisma.service';

// Define o tipo para PureMetalLot com as relações incluídas pelo findOne do repositório
const pureMetalLotIncludeArgs = {
  sale: {
    include: {
      pessoa: {
        select: {
          name: true,
        },
      },
    },
  },
  chemicalReactions: {
    include: {
      chemicalReaction: {
        select: {
          id: true,
          reactionNumber: true,
          outputProductGrams: true,
        },
      },
    },
  },
} satisfies Prisma.pure_metal_lotsInclude; // Use satisfies to ensure it matches Prisma's expectations


@Injectable()
export class PureMetalLotsService {
  constructor(
    private readonly pureMetalLotsRepository: PureMetalLotsRepository,
    private readonly entityCounterService: EntityCounterService,
    private readonly prisma: PrismaService,
  ) {}

  async create(organizationId: string, createPureMetalLotDto: CreatePureMetalLotDto, tx?: any) {
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
    } = createPureMetalLotDto;
    
    const nextLotNumber = await this.entityCounterService.getNextNumber(EntityType.PURE_METAL_LOT, organizationId);
    const lotNumber = `LMP-${String(nextLotNumber).padStart(6, '0')}`;
    const prisma = tx || this.prisma;

    // Use default sourceId for purchases if missing
    const finalSourceId = sourceId || (rest.sourceType === 'COMPRA' ? 'COMPRA' : '');

    const entryDateObject = entryDate
      ? entryDate.includes('T')
        ? new Date(entryDate)
        : new Date(`${entryDate}T12:00:00`)
      : new Date();

    const lot = await prisma.pure_metal_lots.create({
      data: {
        ...rest,
        sourceId: finalSourceId,
        lotNumber,
        organizationId,
        initialGrams,
        remainingGrams: remainingGrams !== undefined ? remainingGrams : initialGrams,
        entryDate: entryDateObject,
      },
    });

    // Create initial entry movement
    await prisma.pureMetalLotMovement.create({
      data: {
        organizationId,
        pureMetalLotId: lot.id,
        type: 'ENTRY',
        grams: initialGrams,
        date: entryDateObject,
        notes: lot.notes || 'Entrada inicial do lote',
      },
    });

    // Handle Client Advance Credit
    if (rest.sourceType === 'ADIANTAMENTO_CLIENTE' && clientId) {
      const client = await prisma.pessoa.findUnique({
        where: { id: clientId, organizationId },
      });

      if (client) {
        let metalAccount = await prisma.metalAccount.findFirst({
          where: {
            personId: client.id,
            type: rest.metalType,
            organizationId,
          },
        });

        if (!metalAccount) {
          metalAccount = await prisma.metalAccount.create({
            data: {
              organizationId,
              personId: client.id,
              type: rest.metalType,
            },
          });
        }

        await prisma.metalAccountEntry.create({
          data: {
            metalAccountId: metalAccount.id,
            date: entryDateObject,
            description: `Adiantamento de Metal - Lote ${lotNumber}`,
            grams: initialGrams, // Credit is positive
            type: 'CREDIT',
            sourceId: lot.id,
          },
        });

        // Also create a MetalCredit record to show in the "Créditos Clientes" page
        await prisma.metalCredit.create({
          data: {
            organizationId,
            clientId: client.id,
            metalType: rest.metalType,
            grams: initialGrams,
            date: entryDateObject,
            status: 'PENDING',
            settledGrams: 0,
            // chemicalAnalysisId is null by default now
          }
        });
      }
    }

    // Handle Metal Purchase (create AccountPay)
    if (rest.sourceType === 'COMPRA' && createPureMetalLotDto.supplierId && createPureMetalLotDto.purchaseAmount) {
      // Ensure supplier has Fornecedor role
      const dbSupplier = await prisma.pessoa.findUnique({
        where: { id: createPureMetalLotDto.supplierId },
        include: { fornecedor: true }
      });

      if (dbSupplier && !dbSupplier.fornecedor) {
        await prisma.fornecedor.create({
          data: { 
            pessoaId: dbSupplier.id, 
            organizationId 
          }
        });
      }

      await prisma.accountPay.create({
        data: {
          description: `Compra de Metal - Lote ${lotNumber}`,
          amount: new Prisma.Decimal(createPureMetalLotDto.purchaseAmount),
          dueDate: createPureMetalLotDto.purchaseDueDate 
            ? new Date(`${createPureMetalLotDto.purchaseDueDate}T12:00:00`) 
            : new Date(),
          organizationId,
          fornecedorId: createPureMetalLotDto.supplierId,
        },
      });
    }

    return lot;
  }

  async findAll(organizationId: string, metalType?: TipoMetal, remainingGramsGt?: number) {
    const pureMetalLots = await this.pureMetalLotsRepository.findAll(organizationId, metalType, remainingGramsGt);

    const lotsWithOriginDetails = await Promise.all(pureMetalLots.map(async (lot) => {
      let originDetails: { name?: string; orderNumber?: string } = {};

      if (lot.sourceType === 'RECOVERY_ORDER' && lot.sourceId) {
        const recoveryOrder = await this.pureMetalLotsRepository.findRecoveryOrder(lot.sourceId, organizationId);
        if (recoveryOrder) {
          originDetails.orderNumber = recoveryOrder.orderNumber;
          if (recoveryOrder.observacoes) {
            originDetails.name = recoveryOrder.observacoes;
          }
        }
      } else if ((lot.sourceType === 'SALE_PAYMENT' || lot.sourceType === 'LEGACY_SALE_CORRECTION') && lot.sale?.pessoa?.name) {
        originDetails.name = lot.sale.pessoa.name;
        originDetails.orderNumber = String(lot.sale.orderNumber);
      } else if (lot.sourceType === 'METAL_CREDIT' && lot.sourceId) {
        const metalCredit = await this.pureMetalLotsRepository.findMetalCredit(lot.sourceId, organizationId);
        if (metalCredit?.client?.name) {
          originDetails.name = metalCredit.client.name;
        }
      } else if (lot.sourceType === 'CHEMICAL_REACTION' && lot.chemicalReactions && lot.chemicalReactions.length > 0) {
        const reaction = lot.chemicalReactions[0].chemicalReaction;
        originDetails.orderNumber = reaction.reactionNumber;
        if (reaction.notes) {
          originDetails.name = reaction.notes; // Usando 'name' para as observações da reação
        }
      }

      return {
        ...lot,
        description: lot.description, // Adiciona a descrição
        sale: lot.sale ? {
          ...lot.sale,
          totalAmount: lot.sale.totalAmount ? Number(lot.sale.totalAmount) : undefined,
        } : undefined,
        originDetails, // Adiciona os detalhes da origem
      };
    }));

    return lotsWithOriginDetails;
  }

  async findOne(organizationId: string, id: string) {
    const pureMetalLot = await this.pureMetalLotsRepository.findOne(id, organizationId);

    if (!pureMetalLot) {
      return null;
    }

    return {
      ...pureMetalLot,
      sale: pureMetalLot.sale ? {
        ...pureMetalLot.sale,
        totalAmount: pureMetalLot.sale.totalAmount ? Number(pureMetalLot.sale.totalAmount) : undefined,
      } : undefined,
    };
  }

  async update(organizationId: string, id: string, updatePureMetalLotDto: UpdatePureMetalLotDto) {
    const { entryDate, ...rest } = updatePureMetalLotDto;
    const data: any = { ...rest };
    if (entryDate) {
      data.entryDate = entryDate.includes('T')
        ? new Date(entryDate)
        : new Date(`${entryDate}T12:00:00`);
    }
    return this.pureMetalLotsRepository.update(id, data);
  }

  async remove(organizationId: string, id: string) {
    return this.pureMetalLotsRepository.remove(id);
  }

  async findPureMetalLotMovements(pureMetalLotId: string, organizationId: string) {
    return this.pureMetalLotsRepository.findManyByPureMetalLotId(pureMetalLotId, organizationId);
  }

  async createPureMetalLotMovement(
    organizationId: string,
    pureMetalLotId: string,
    data: { type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT'; grams: number; notes?: string },
    tx?: any,
  ) {
    const prisma = tx || this.prisma;
    const movement = await prisma.pureMetalLotMovement.create({
      data: {
        organizationId,
        pureMetalLotId,
        ...data,
      },
    });

    const lot = await prisma.pure_metal_lots.findUnique({ where: { id: pureMetalLotId } });
    if (!lot) {
      throw new NotFoundException(`Lote de metal puro com ID ${pureMetalLotId} não encontrado.`);
    }

    let newRemainingGrams = lot.remainingGrams;
    if (data.type === 'ENTRY') {
      newRemainingGrams += data.grams;
    } else if (data.type === 'EXIT') {
      newRemainingGrams -= data.grams;
    }

    let newStatus = lot.status;
    if (newRemainingGrams <= 0) {
      newStatus = 'USED';
    } else if (newRemainingGrams >= lot.initialGrams) {
      newStatus = 'AVAILABLE';
    } else {
      newStatus = 'PARTIALLY_USED';
    }

    await prisma.pure_metal_lots.update({
      where: { id: pureMetalLotId },
      data: { 
        remainingGrams: newRemainingGrams,
        status: newStatus as any,
      },
    });

    return movement;
  }

  private async ensurePureMetalProduct(organizationId: string, metalType: TipoMetal, tx: Prisma.TransactionClient) {
    const productName = metalType === TipoMetal.AU ? 'Ouro Puro (LMP)' : 'Prata Pura (LMP)';
    
    // 1. Tentar encontrar por nome exato
    let product = await tx.product.findFirst({
      where: { 
        organizationId,
        name: { equals: productName, mode: 'insensitive' }
      }
    });

    if (product) return product;

    // 2. Se não encontrar, tentar encontrar um que tenha goldValue = 1.0 (para Ouro)
    if (metalType === TipoMetal.AU) {
      product = await tx.product.findFirst({
        where: {
          organizationId,
          goldValue: 1.0
        }
      });
      if (product) return product;
    }

    // 3. Se ainda não encontrar, criar um novo
    return tx.product.create({
      data: {
        organizationId,
        name: productName,
        price: 0,
        stockUnit: 'GRAMS',
        goldValue: 1.0,
        description: `Produto automático para venda de metal puro (${metalType})`
      }
    });
  }

  async sell(organizationId: string, userId: string, id: string, dto: SellPureMetalLotDto) {
    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.pure_metal_lots.findUnique({
        where: { id },
      });

      if (!lot) {
        throw new NotFoundException(`Lote de metal puro com ID ${id} não encontrado.`);
      }

      if (lot.remainingGrams < dto.grams) {
        throw new BadRequestException(`Quantidade insuficiente no lote. Disponível: ${lot.remainingGrams}g.`);
      }

      // 1. Get next order number for Sale
      const lastSale = await tx.sale.findFirst({
        where: { organizationId },
        orderBy: { orderNumber: 'desc' },
      });
      const nextOrderNumber = (lastSale?.orderNumber || 31700) + 1;

      // 2. Garantir que o produto de metal puro existe
      const metalProduct = await this.ensurePureMetalProduct(organizationId, lot.metalType, tx);

      // 3. Create Sale
      const sale = await tx.sale.create({
        data: {
          organizationId,
          pessoaId: dto.clientId,
          orderNumber: nextOrderNumber,
          totalAmount: dto.totalAmount,
          status: 'FINALIZADO',
          observation: dto.notes || `Venda de Metal - Lote ${lot.lotNumber}`,
          createdAt: dto.date ? new Date(dto.date) : new Date(),
        },
      });

      // 4. Create SaleItem (NOVO: Para evitar pedido em branco e calcular lucro)
      const itemPrice = dto.grams > 0 ? (dto.totalAmount / dto.grams) : 0;
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: metalProduct.id,
          quantity: dto.grams,
          price: itemPrice,
          costPriceAtSale: 0, // O custo em gramas será determinado pelo goldValue do produto
        }
      });

      // 5. Create AccountRec
      await tx.accountRec.create({
        data: {
          organizationId,
          saleId: sale.id,
          description: `Venda de Metal - Lote ${lot.lotNumber}`,
          amount: dto.totalAmount,
          dueDate: dto.date ? new Date(dto.date) : new Date(),
        },
      });

      // 6. Create Movement
      await tx.pureMetalLotMovement.create({
        data: {
          organizationId,
          pureMetalLotId: id,
          type: 'EXIT',
          grams: dto.grams,
          date: dto.date ? new Date(dto.date) : new Date(),
          notes: dto.notes || `Venda vinculada ao pedido #${nextOrderNumber}`,
        },
      });

      // 7. Update Lot
      const newRemainingGrams = lot.remainingGrams - dto.grams;
      let newStatus = lot.status;
      if (newRemainingGrams <= 0) {
        newStatus = 'USED';
      } else if (newRemainingGrams < lot.initialGrams) {
        newStatus = 'PARTIALLY_USED';
      }

      return tx.pure_metal_lots.update({
        where: { id },
        data: {
          remainingGrams: newRemainingGrams,
          status: newStatus as any,
          saleId: sale.id, // Vínculo com a venda
        },
      });
    });
  }
}