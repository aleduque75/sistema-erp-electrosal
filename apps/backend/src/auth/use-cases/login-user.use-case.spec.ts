import { LoginUserUseCase } from './login-user.use-case';
import { JwtService } from '@nestjs/jwt';

describe('LoginUserUseCase', () => {
  it('should sign payload and return access_token', async () => {
    const mockJwtService = {
      sign: jest.fn().mockReturnValue('jwt-login-token'),
    } as unknown as JwtService;

    const useCase = new LoginUserUseCase(mockJwtService);
    const result = await useCase.execute({
      id: 'usr-1',
      email: 'admin@electrosal.com.br',
      organizationId: 'org-1',
    });

    expect(result.access_token).toBe('jwt-login-token');
    expect(mockJwtService.sign).toHaveBeenCalledWith({
      email: 'admin@electrosal.com.br',
      sub: 'usr-1',
      orgId: 'org-1',
    });
  });
});
