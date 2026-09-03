import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CreatePureMetalLotMovementDto } from './dtos/create-pure-metal-lot-movement.dto';
import { UpdatePureMetalLotMovementDto } from './dtos/update-pure-metal-lot-movement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { CreatePureMetalLotMovementUseCase } from './use-cases/create-pure-metal-lot-movement.use-case';
import { ListPureMetalLotMovementsUseCase } from './use-cases/list-pure-metal-lot-movements.use-case';
import { GetPureMetalLotMovementByIdUseCase } from './use-cases/get-pure-metal-lot-movement-by-id.use-case';
import { UpdatePureMetalLotMovementUseCase } from './use-cases/update-pure-metal-lot-movement.use-case';
import { DeletePureMetalLotMovementUseCase } from './use-cases/delete-pure-metal-lot-movement.use-case';

@UseGuards(JwtAuthGuard)
@Controller('pure-metal-lot-movements')
export class PureMetalLotMovementsController {
  constructor(
    private readonly createMovementUseCase: CreatePureMetalLotMovementUseCase,
    private readonly listMovementsUseCase: ListPureMetalLotMovementsUseCase,
    private readonly getMovementByIdUseCase: GetPureMetalLotMovementByIdUseCase,
    private readonly updateMovementUseCase: UpdatePureMetalLotMovementUseCase,
    private readonly deleteMovementUseCase: DeletePureMetalLotMovementUseCase,
  ) {}

  @Post()
  create(
    @Body() createPureMetalLotMovementDto: CreatePureMetalLotMovementDto,
    @CurrentUser() user: User,
  ) {
    return this.createMovementUseCase.execute(
      createPureMetalLotMovementDto,
      user.organizationId,
    );
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('pureMetalLotId') pureMetalLotId?: string,
  ) {
    return this.listMovementsUseCase.execute(user.organizationId, pureMetalLotId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.getMovementByIdUseCase.execute(id, user.organizationId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePureMetalLotMovementDto: UpdatePureMetalLotMovementDto,
    @CurrentUser() user: User,
  ) {
    return this.updateMovementUseCase.execute(
      id,
      updatePureMetalLotMovementDto,
      user.organizationId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.deleteMovementUseCase.execute(id, user.organizationId);
  }
}
