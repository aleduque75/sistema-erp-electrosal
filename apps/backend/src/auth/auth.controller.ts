import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterUserDto } from './dtos/auth.dto';
import { Public } from './decorators/public.decorator'; // <-- 1. IMPORTE O DECORATOR
import { JwtAuthGuard } from './jwt-auth.guard'; // Import JwtAuthGuard

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() // <-- 2. MARQUE A ROTA COMO PÚBLICA
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Public() // <-- 3. MARQUE A ROTA COMO PÚBLICA
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK) // Boa prática: retorna 200 OK no login
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard) // Protect this endpoint with JWT authentication
  @Get('me')
  getMe(@Request() req) {
    return req.user; // The JwtAuthGuard attaches the user to the request
  }
}
