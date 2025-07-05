'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export default function ClientsPage() {
  const { user, loading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      fetchClients();
    }
  }, [user, loading]);

  const fetchClients = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await api.get('/clients', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setClients(response.data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      await api.delete(`/clients/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setClients(clients.filter((client) => client.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to view clients.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clients</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Link href="/clients/create">
            <Button>Create New Client</Button>
          </Link>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <Table className="border border-border">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>
                  <Link href={`/clients/${client.id}`}>
                    <Button variant="link" className="mr-2">View</Button>
                  </Link>
                  <Link href={`/clients/${client.id}/edit`}>
                    <Button variant="link" className="mr-2">Edit</Button>
                  </Link>
                  <Button variant="destructive" onClick={() => handleDelete(client.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
