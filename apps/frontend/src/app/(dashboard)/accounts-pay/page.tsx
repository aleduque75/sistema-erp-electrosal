'use client';

import { useEffect, useState } from 'react';
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

export default function AccountsPayPage() {
  const { user, loading } = useAuth();
  const [accountsPay, setAccountsPay] = useState<AccountPay[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      fetchAccountsPay();
    }
  }, [user, loading]);

  const fetchAccountsPay = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await api.get('/accounts-pay', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setAccountsPay(
        response.data.map((account: any) => ({
          ...account,
          amount: parseFloat(account.amount),
        }))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      await api.delete(`/accounts-pay/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setAccountsPay(accountsPay.filter((account) => account.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to view accounts payable.</p>;
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold mb-4">Accounts Payable</h1>
      <Link href="/accounts-pay/create" className="btn-primary mb-4 inline-block">
        Create New Account Payable
      </Link>
      {error && <p className="text-danger mb-4">{error}</p>}
      <table className="table-auto">
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Paid</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accountsPay.map((account) => (
            <tr key={account.id}>
              <td>{account.description}</td>
              <td>{account.amount.toFixed(2)}</td>
              <td>{new Date(account.dueDate).toLocaleDateString()}</td>
              <td>{account.paid ? 'Yes' : 'No'}</td>
              <td>
                <Link href={`/accounts-pay/${account.id}`} className="text-primary-600 hover:underline mr-2">
                  View
                </Link>
                <Link href={`/accounts-pay/${account.id}/edit`} className="text-secondary-600 hover:underline mr-2">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-danger hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}