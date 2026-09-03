import { AccountRecEntity } from './account-rec.entity';

describe('AccountRecEntity', () => {
  it('should create account rec with pending status by default', () => {
    const account = AccountRecEntity.create({
      organizationId: 'org-1',
      description: 'Venda de Produto',
      amount: 1200,
      dueDate: new Date('2026-04-15'),
    });

    expect(account.organizationId).toBe('org-1');
    expect(account.amountNumber).toBe(1200);
    expect(account.received).toBe(false);
    expect(account.status.isPending).toBe(true);
  });

  it('should mark as received', () => {
    const account = AccountRecEntity.create({
      organizationId: 'org-1',
      description: 'Venda de Produto',
      amount: 1200,
      dueDate: new Date('2026-04-15'),
    });

    account.markAsReceived(new Date('2026-04-14'));
    expect(account.received).toBe(true);
    expect(account.status.isReceived).toBe(true);
    expect(account.receivedAt).toBeDefined();
  });

  it('should force finalize', () => {
    const account = AccountRecEntity.create({
      organizationId: 'org-1',
      description: 'Venda Especial',
      amount: 500,
      dueDate: new Date('2026-04-15'),
    });

    account.forceFinalize();
    expect(account.received).toBe(true);
  });
});
