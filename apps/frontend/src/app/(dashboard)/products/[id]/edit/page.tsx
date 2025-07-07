'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

export default function EditProductPage() {
  const { user, loading } = useAuth();
  const { id } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && id) {
      fetchProduct();
    }
  }, [user, loading, id]);

  const fetchProduct = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await api.get(`/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setFormData({
        name: response.data.name || '',
        description: response.data.description || '',
        price: response.data.price !== undefined ? response.data.price.toString() : '',
        stock: response.data.stock !== undefined ? response.data.stock.toString() : '',
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
      await api.patch(`/products/${id}`, {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      router.push(`/products/${id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to edit products.</p>;
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
      {error && <p className="text-danger mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="w-full max-w-lg">
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full" required />
        </div>
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} className="w-full"></textarea>
        </div>
        <div className="mb-4">
          <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Price:</label>
          <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} className="w-full" step="0.01" required />
        </div>
        <div className="mb-4">
          <label htmlFor="stock" className="block text-gray-700 text-sm font-bold mb-2">Stock:</label>
          <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} className="w-full" required />
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="btn-primary">
            Update Product
          </button>
          <Link href={`/products/${id}`} className="text-primary-600 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}