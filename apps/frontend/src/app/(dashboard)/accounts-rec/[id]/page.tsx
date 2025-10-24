'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';
import { InstallmentList } from '@/components/sales/InstallmentList';

import { SaleInstallment } from '@/types/sale';
import { SaleStatus } from '@prisma/client'; // Import SaleStatus

interface AccountRec {
  id: string;
  description: string;
  amount: number;
  receiveDate: string;
  received: boolean;
  receivedAt?: string;
  saleId?: string; // Add saleId
  installments?: SaleInstallment[]; // Add installments
  sale?: { // Add sale object to AccountRec interface
    status: SaleStatus;
  };
}

export default function AccountRecDetailPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const id = params?.id;
  const [account, setAccount] = useState<AccountRec | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && id) {
      fetchAccountRec();
    }
  }, [user, loading, id]);

  const fetchAccountRec = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await api.get(`/accounts-rec/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setAccount({
        ...response.data,
        amount: parseFloat(response.data.amount),
        installments: response.data.sale?.installments || [], // Map installments
        saleId: response.data.sale?.id || undefined, // Map saleId
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to view account receivable details.</p>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  if (!account) {
    return <p>Account Receivable not found.</p>;
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold mb-4">Account Receivable Details</h1>
      <p><strong>Description:</strong> {account.description}</p>
      <p><strong>Amount:</strong> {account.amount.toFixed(2)}</p>
      <p><strong>Receive Date:</strong> {new Date(account.receiveDate).toLocaleDateString()}</p>
      <p><strong>Received:</strong> {account.received ? 'Yes' : 'No'}</p>
      {account.received && <p><strong>Received At:</strong> {account.receivedAt ? new Date(account.receivedAt).toLocaleDateString() : 'N/A'}</p>}
      {account.saleId && account.installments && account.installments.length > 0 && account.sale?.status === 'FINALIZADO' && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-3">Parcelas da Venda</h2>
          <InstallmentList installments={account.installments} saleId={account.saleId!} onInstallmentPaid={fetchAccountRec} />
        </div>
      )}

      <div className="mt-4">
        <Link href={`/accounts-rec/${account.id}/edit`} className="btn-secondary mr-2">
          Edit Account Receivable
        </Link>
        <Link href="/accounts-rec" className="btn-primary">
          Back to Accounts Receivable
        </Link>
      </div>
    </div>
  );
}