import { RegisterUserUseCase } from './register-user.use-case';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUsersService: jest.Mocked<Partial<UsersService>>;
  let mockJwtService: jest.Mocked<Partial<JwtService>>;

  beforeEach(() => {
    mockUsersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        organizationId: 'org-1',
      } as any),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-token-xyz'),
    };

    useCase = new RegisterUserUseCase(
      mockUsersService as UsersService,
      mockJwtService as JwtService,
    );
  });

  it('should register user and return access_token', async () => {
    const result = await useCase.execute({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.access_token).toBe('mock-token-xyz');
    expect(mockUsersService.create).toHaveBeenCalled();
  });
});
