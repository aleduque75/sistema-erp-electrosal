import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// 1. Mocks: Criamos versões "falsas" dos serviços dos quais o AuthService depende.
// Isso nos permite testar o AuthService de forma isolada.
const mockUsersService = {
  findByEmail: jest.fn(),
};
const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  // 2. Setup do Módulo de Teste: Antes de cada teste, criamos um módulo do NestJS
  // que usa nossos mocks no lugar dos serviços reais.
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // Limpa o estado dos mocks após cada teste
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Teste simples para garantir que o serviço foi criado
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 3. Suíte de Testes para o Método 'login'
  describe('login', () => {
    it('deve retornar um access token para um login bem-sucedido', async () => {
      // Arrange (Preparação): Definimos o cenário
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const user = {
        id: 'uuid-123',
        email: 'test@example.com',
        password: 'hashedpassword',
      };
      const token = 'jwt-token-string';

      mockUsersService.findByEmail.mockResolvedValue(user); // Simula que o usuário foi encontrado
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never); // Simula que a senha bate
      mockJwtService.sign.mockReturnValue(token); // Simula a geração do token

      // Act (Ação): Executamos o método que queremos testar
      const result = await service.login(loginDto);

      // Assert (Verificação): Verificamos se o resultado é o esperado
      expect(result).toEqual({ accessToken: token });
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it('deve lançar UnauthorizedException para credenciais inválidas', async () => {
      // Arrange
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };
      const user = {
        id: 'uuid-123',
        email: 'test@example.com',
        password: 'hashedpassword',
      };

      mockUsersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never); // Simula que a senha NÃO bate

      // Act & Assert: Verificamos se o método lança o erro esperado
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
