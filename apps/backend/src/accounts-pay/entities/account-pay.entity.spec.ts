import { AccountPayEntity } from './account-pay.entity';

describe('AccountPayEntity', () => {
  it('should create account pay with pending status by default', () => {
    const account = AccountPayEntity.create({
      organizationId: 'org-1',
      description: 'Conta de Energia',
      amount: 150.5,
      dueDate: new Date('2026-04-10'),
    });

    expect(account.organizationId).toBe('org-1');
    expect(account.amountNumber).toBe(150.5);
    expect(account.paid).toBe(false);
    expect(account.status.isPending).toBe(true);
  });

  it('should mark as paid', () => {
    const account = AccountPayEntity.create({
      organizationId: 'org-1',
      description: 'Conta de Água',
      amount: 80,
      dueDate: new Date('2026-04-10'),
    });

    account.markAsPaid(new Date('2026-04-09'), 'tx-123');
    expect(account.paid).toBe(true);
    expect(account.status.isPaid).toBe(true);
    expect(account.transacaoId).toBe('tx-123');
  });

  it('should split into installments accurately', () => {
    const account = AccountPayEntity.create({
      id: 'acc-parent',
      organizationId: 'org-1',
      description: 'Equipamento',
      amount: 100,
      dueDate: new Date('2026-05-01'),
    });

    const installments = account.split(3);
    expect(installments).toHaveLength(3);
    expect(installments[0].amountNumber).toBe(33.34);
    expect(installments[1].amountNumber).toBe(33.33);
    expect(installments[2].amountNumber).toBe(33.33);

    const totalSum = installments.reduce((sum, item) => sum + item.amountNumber, 0);
    expect(totalSum).toBe(100);
  });
});
