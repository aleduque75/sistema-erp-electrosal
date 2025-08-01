// Em: apps/backend/src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto } from './dtos/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ... (seu método de register, se existir)

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    // --- PONTO DE DEBUG ---
    // Vamos imprimir os dados exatamente como chegam do frontend
    console.log('--- DADOS RECEBIDOS NA ROTA DE LOGIN ---');
    console.log(`Email Recebido: '${loginUserDto.email}'`);
    console.log(`Senha Recebida: '${loginUserDto.password}'`);
    console.log('---------------------------------------');
    // ------------------------

    return this.authService.login(loginUserDto);
  }
}
