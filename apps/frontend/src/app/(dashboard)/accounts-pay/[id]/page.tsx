'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

interface AccountPay {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidAt?: string;
}

export default function AccountPayDetailPage() {
  const { user, loading } = useAuth();
  const { id } = useParams();
  const [account, setAccount] = useState<AccountPay | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && id) {
      fetchAccountPay();
    }
  }, [user, loading, id]);

  const fetchAccountPay = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await api.get(`/accounts-pay/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setAccount({ ...response.data, amount: parseFloat(response.data.amount) });
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to view account payable details.</p>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  if (!account) {
    return <p>Account Payable not found.</p>;
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold mb-4">Account Payable Details</h1>
      <p><strong>Description:</strong> {account.description}</p>
      <p><strong>Amount:</strong> {account.amount.toFixed(2)}</p>
      <p><strong>Due Date:</strong> {new Date(account.dueDate).toLocaleDateString()}</p>
      <p><strong>Paid:</strong> {account.paid ? 'Yes' : 'No'}</p>
      {account.paid && <p><strong>Paid At:</strong> {account.paidAt ? new Date(account.paidAt).toLocaleDateString() : 'N/A'}</p>}
      <div className="mt-4">
        <Link href={`/accounts-pay/${account.id}/edit`} className="btn-secondary mr-2">
          Edit Account Payable
        </Link>
        <Link href="/accounts-pay" className="btn-primary">
          Back to Accounts Payable
        </Link>
      </div>
    </div>
  );
}