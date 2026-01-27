'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

export default function EditAccountPayPage() {
  const { user, isLoading } = useAuth();
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    dueDate: '',
    paid: false,
    paidAt: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user && id) {
      fetchAccountPay();
    }
  }, [user, isLoading, id]);

  const fetchAccountPay = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await api.get(`/accounts-pay/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setFormData({
        description: response.data.description || '',
        amount: response.data.amount !== undefined ? response.data.amount.toString() : '',
        dueDate: response.data.dueDate ? new Date(response.data.dueDate).toISOString().split('T')[0] : '',
        paid: response.data.paid || false,
        paidAt: response.data.paidAt ? new Date(response.data.paidAt).toISOString().split('T')[0] : '',
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('User not authenticated.');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setError('Access token not found.');
      return;
    }

    try {
      await api.patch(`/accounts-pay/${id}`, {
        ...formData,
        amount: parseFloat(formData.amount),
        paidAt: formData.paid ? formData.paidAt : null,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      router.push(`/accounts-pay/${id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to edit accounts payable.</p>;
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Account Payable</h1>
      {error && <p className="text-danger mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="w-full max-w-lg">
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
          <input type="text" id="description" name="description" value={formData.description} onChange={handleChange} className="w-full" required />
        </div>
        <div className="mb-4">
          <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">Amount:</label>
          <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} className="w-full" step="0.01" required />
        </div>
        <div className="mb-4">
          <label htmlFor="dueDate" className="block text-gray-700 text-sm font-bold mb-2">Due Date:</label>
          <input type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full" required />
        </div>
        <div className="mb-4">
          <label htmlFor="paid" className="block text-gray-700 text-sm font-bold mb-2">
            <input type="checkbox" id="paid" name="paid" checked={formData.paid} onChange={handleChange} className="mr-2 leading-tight" />
            <span className="text-sm">Paid</span>
          </label>
        </div>
        {formData.paid && (
          <div className="mb-4">
            <label htmlFor="paidAt" className="block text-gray-700 text-sm font-bold mb-2">Paid At:</label>
            <input type="date" id="paidAt" name="paidAt" value={formData.paidAt} onChange={handleChange} className="w-full" />
          </div>
        )}
        <div className="flex items-center justify-between">
          <button type="submit" className="btn-primary">
            Update Account Payable
          </button>
          <Link href={`/accounts-pay/${id}`} className="text-primary-600 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}