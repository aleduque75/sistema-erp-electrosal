import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  NotFoundException,
  UseGuards,
  Req,
} from '@nestjs/common';
// import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dtos/role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express'; // Import Request type

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  // constructor(private readonly rolesService: RolesService) {}

  // @Post()
  // async create(@Req() req: Request, @Body() createRoleDto: CreateRoleDto) {
  //   const organizationId = req.user['orgId'];
  //   return this.rolesService.create(
  //     organizationId,
  //     createRoleDto.name,
  //     createRoleDto.description,
  //     createRoleDto.permissionNames,
  //   );
  // }

  // @Get()
  // async findAll(@Req() req: Request) {
  //   const organizationId = req.user['orgId'];
  //   return this.rolesService.findAll(organizationId);
  // }

  // @Get(':id')
  // async findOne(@Req() req: Request, @Param('id') id: string) {
  //   const organizationId = req.user['orgId'];
  //   const role = await this.rolesService.findOne(organizationId, id);
  //   if (!role) {
  //     throw new NotFoundException(`Role with ID "${id}" not found`);
  //   }
  //   return role;
  // }

  // @Put(':id')
  // async update(
  //   @Req() req: Request,
  //   @Param('id') id: string,
  //   @Body() updateRoleDto: UpdateRoleDto,
  // ) {
  //   const organizationId = req.user['orgId'];
  //   const role = await this.rolesService.findOne(organizationId, id);
  //   if (!role) {
  //     throw new NotFoundException(`Role with ID "${id}" not found`);
  //   }
  //   return this.rolesService.update(
  //     organizationId,
  //     id,
  //     updateRoleDto.name,
  //     updateRoleDto.description,
  //     updateRoleDto.permissionNames,
  //   );
  // }

  // @Delete(':id')
  // async remove(@Req() req: Request, @Param('id') id: string) {
  //   const organizationId = req.user['orgId'];
  //   const role = await this.rolesService.findOne(organizationId, id);
  //   if (!role) {
  //     throw new NotFoundException(`Role with ID "${id}" not found`);
  //   }
  //   return this.rolesService.remove(organizationId, id);
  // }
}
