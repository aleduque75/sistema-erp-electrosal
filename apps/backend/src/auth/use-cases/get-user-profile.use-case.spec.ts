import { GetUserProfileUseCase } from './get-user-profile.use-case';
import { UsersService } from '../../users/users.service';

describe('GetUserProfileUseCase', () => {
  it('should return user profile with settings', async () => {
    const mockUsersService = {
      findByIdAndOrganization: jest.fn().mockResolvedValue({
        id: 'usr-1',
        name: 'Admin',
        organizationId: 'org-1',
        settings: { defaultCaixaContaId: 'cx-1' },
      }),
    } as unknown as UsersService;

    const useCase = new GetUserProfileUseCase(mockUsersService);
    const result = await useCase.execute('usr-1', 'org-1');

    expect(result.id).toBe('usr-1');
    expect((result as any).settings.defaultCaixaContaId).toBe('cx-1');
  });
});
