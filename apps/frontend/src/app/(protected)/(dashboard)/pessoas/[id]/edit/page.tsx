'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

export default function EditClientPage() {
  const { user, isLoading } = useAuth();
  const params = useParams() as Record<string, string | string[]>;
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    preferences: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user && id) {
      fetchClient();
    }
  }, [user, isLoading, id]);

  const fetchClient = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await api.get(`/clients/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        birthDate: response.data.birthDate ? new Date(response.data.birthDate).toISOString().split('T')[0] : '',
        gender: response.data.gender || '',
        preferences: response.data.preferences || '',
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      const dataToSend = {
        ...formData,
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
      };

      await api.patch(`/clients/${id}`, dataToSend, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      router.push(`/clients/${id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to edit clients.</p>;
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Client</h1>
      {error && <p className="text-danger mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="w-full max-w-lg">
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full" required />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="w-full" />
        </div>
        <div className="mb-4">
          <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">Phone:</label>
          <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="w-full" />
        </div>
        <div className="mb-4">
          <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">Address:</label>
          <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} className="w-full" />
        </div>
        <div className="mb-4">
          <label htmlFor="birthDate" className="block text-gray-700 text-sm font-bold mb-2">Birth Date:</label>
          <input type="date" id="birthDate" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full" />
        </div>
        <div className="mb-4">
          <label htmlFor="gender" className="block text-gray-700 text-sm font-bold mb-2">Gender:</label>
          <input type="text" id="gender" name="gender" value={formData.gender} onChange={handleChange} className="w-full" />
        </div>
        <div className="mb-4">
          <label htmlFor="preferences" className="block text-gray-700 text-sm font-bold mb-2">Preferences:</label>
          <textarea id="preferences" name="preferences" value={formData.preferences} onChange={handleChange} className="w-full"></textarea>
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="btn-primary">
            Update Client
          </button>
          <Link href={`/clients/${id}`} className="text-primary-600 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}