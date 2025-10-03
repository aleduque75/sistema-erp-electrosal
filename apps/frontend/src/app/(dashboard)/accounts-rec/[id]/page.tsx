'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

interface AccountRec {
  id: string;
  description: string;
  amount: number;
  receiveDate: string;
  received: boolean;
  receivedAt?: string;
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