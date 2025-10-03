'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  gender?: string;
  preferences?: string;
}

export default function ClientDetailPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params?.id[0] : undefined;
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && id) {
      fetchClient();
    }
  }, [user, loading, id]);

  const fetchClient = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await api.get(`/clients/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setClient(response.data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to view client details.</p>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  if (!client) {
    return <p>Client not found.</p>;
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold mb-4">Client Details</h1>
      <p><strong>Name:</strong> {client.name}</p>
      <p><strong>Email:</strong> {client.email}</p>
      <p><strong>Phone:</strong> {client.phone}</p>
      <p><strong>Address:</strong> {client.address}</p>
      <p><strong>Birth Date:</strong> {client.birthDate ? new Date(client.birthDate).toLocaleDateString() : 'N/A'}</p>
      <p><strong>Gender:</strong> {client.gender}</p>
      <p><strong>Preferences:</strong> {client.preferences}</p>
      <div className="mt-4">
        <Link href={`/clients/${client.id}/edit`} className="btn-secondary mr-2">
          Edit Client
        </Link>
        <Link href="/clients" className="btn-primary">
          Back to Clients
        </Link>
      </div>
    </div>
  );
}