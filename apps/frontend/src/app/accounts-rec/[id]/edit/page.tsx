'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Link from 'next/link';
import api from '../../../../lib/api';

export default function EditAccountRecPage() {
  const { user, loading } = useAuth();
  const { id } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    receiveDate: '',
    received: false,
    receivedAt: '',
  });
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
      setFormData({
        description: response.data.description || '',
        amount: response.data.amount !== undefined ? response.data.amount.toString() : '',
        receiveDate: response.data.receiveDate ? new Date(response.data.receiveDate).toISOString().split('T')[0] : '',
        received: response.data.received || false,
        receivedAt: response.data.receivedAt ? new Date(response.data.receivedAt).toISOString().split('T')[0] : '',
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
      await api.patch(`/accounts-rec/${id}`, {
        ...formData,
        amount: parseFloat(formData.amount),
        receivedAt: formData.received ? formData.receivedAt : null,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      router.push(`/accounts-rec/${id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to edit accounts receivable.</p>;
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Account Receivable</h1>
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
          <label htmlFor="receiveDate" className="block text-gray-700 text-sm font-bold mb-2">Receive Date:</label>
          <input type="date" id="receiveDate" name="receiveDate" value={formData.receiveDate} onChange={handleChange} className="w-full" required />
        </div>
        <div className="mb-4">
          <label htmlFor="received" className="block text-gray-700 text-sm font-bold mb-2">
            <input type="checkbox" id="received" name="received" checked={formData.received} onChange={handleChange} className="mr-2 leading-tight" />
            <span className="text-sm">Received</span>
          </label>
        </div>
        {formData.received && (
          <div className="mb-4">
            <label htmlFor="receivedAt" className="block text-gray-700 text-sm font-bold mb-2">Received At:</label>
            <input type="date" id="receivedAt" name="receivedAt" value={formData.receivedAt} onChange={handleChange} className="w-full" />
          </div>
        )}
        <div className="flex items-center justify-between">
          <button type="submit" className="btn-primary">
            Update Account Receivable
          </button>
          <Link href={`/accounts-rec/${id}`} className="text-primary-600 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}