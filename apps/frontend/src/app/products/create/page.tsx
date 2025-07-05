'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import api from '../../../lib/api';

export default function CreateProductPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
  });
  const [error, setError] = useState<string | null>(null);

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
      await api.post('/products', {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      router.push('/products');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to create products.</p>;
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold mb-4">Criar Novo Produto</h1>
      {error && <p className="text-danger mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="w-full max-w-lg">
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Nome:</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full" required />
        </div>
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Descrição:</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} className="w-full"></textarea>
        </div>
        <div className="mb-4">
          <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Preço:</label>
          <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} className="w-full" step="0.01" required />
        </div>
        <div className="mb-4">
          <label htmlFor="stock" className="block text-gray-700 text-sm font-bold mb-2">Estoque:</label>
          <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} className="w-full" required />
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="btn-primary">
            Criar Produto
          </button>
          <Link href="/products" className="text-primary-600 hover:underline">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}