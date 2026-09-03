import { ValidateUserCredentialsUseCase } from './validate-user-credentials.use-case';
import { UsersService } from '../../users/users.service';
import * as bcrypt from 'bcryptjs';

describe('ValidateUserCredentialsUseCase', () => {
  let useCase: ValidateUserCredentialsUseCase;
  let mockUsersService: jest.Mocked<Partial<UsersService>>;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('secret123', 10);
    mockUsersService = {
      findByEmail: jest.fn().mockImplementation(async (email: string) => {
        if (email === 'admin@electrosal.com.br') {
          return {
            id: 'usr-1',
            email,
            password: hashedPassword,
            active: true,
            organizationId: 'org-1',
          } as any;
        }
        return null;
      }),
    };

    useCase = new ValidateUserCredentialsUseCase(mockUsersService as UsersService);
  });

  it('should validate valid user credentials and omit password', async () => {
    const user = await useCase.execute('admin@electrosal.com.br', 'secret123');
    expect(user.id).toBe('usr-1');
    expect((user as any).password).toBeUndefined();
  });

  it('should throw UnauthorizedException on wrong password', async () => {
    await expect(
      useCase.execute('admin@electrosal.com.br', 'wrong-password'),
    ).rejects.toThrow('Credenciais inválidas');
  });

  it('should throw UnauthorizedException on unknown user', async () => {
    await expect(
      useCase.execute('unknown@electrosal.com.br', 'secret123'),
    ).rejects.toThrow('Credenciais inválidas');
  });
});
