import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthRequest } from '../auth/types/auth-request.type';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: AuthRequest) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.usersService.findAll(req.user.organizationId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body(ValidationPipe) updateUserDto: UpdateUserDto, @Request() req: AuthRequest) {
    return this.usersService.update(id, updateUserDto, req.user.organizationId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.usersService.remove(id, req.user.organizationId);
  }
}
