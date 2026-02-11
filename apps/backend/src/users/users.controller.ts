import { Controller, Get, Post, Body, Patch, Param, Delete, Request, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthRequest } from '../auth/types/auth-request.type';
// import { AuthGuard } from '@nestjs/passport'; // Comentado
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
// import { Public } from '../common/decorators/public.decorator'; // Comentado

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @UseGuards(AuthGuard('jwt')) // Comentado
  @Get('profile')
  getProfile(@Request() req: AuthRequest) {
    return req.user;
  }

  // @UseGuards(AuthGuard('jwt')) // Comentado
  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.usersService.findAll(req.user.organizationId);
  }

  // @UseGuards(AuthGuard('jwt')) // Comentado
  // @Public() // Comentado
  @Post()
  create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // @UseGuards(AuthGuard('jwt')) // Comentado
  @Patch(':id')
  update(@Param('id') id: string, @Body(ValidationPipe) updateUserDto: UpdateUserDto, @Request() req: AuthRequest) {
    return this.usersService.update(id, updateUserDto, req.user.organizationId);
  }

  // @UseGuards(AuthGuard('jwt')) // Comentado
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.usersService.remove(id, req.user.organizationId);
  }
}
