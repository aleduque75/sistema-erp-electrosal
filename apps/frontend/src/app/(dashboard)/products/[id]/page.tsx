'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
}

export default function ProductDetailPage() {
  const { user, loading } = useAuth();
  const params = useParams() as Record<string, string | string[]>;
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
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
      setProduct({
        ...response.data,
        price: parseFloat(response.data.price),
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to view product details.</p>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  if (!product) {
    return <p>Product not found.</p>;
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold mb-4">Detalhes do Produto</h1>
      <p><strong>Nome:</strong> {product.name}</p>
      <p><strong>Descrição:</strong> {product.description}</p>
      <p><strong>Preço:</strong> {product.price.toFixed(2)}</p>
      <p><strong>Estoque:</strong> {product.stock}</p>
      <div className="mt-4">
        <Link href={`/products/${product.id}/edit`} className="btn-secondary mr-2">
          Editar Produto
        </Link>
        <Link href="/products" className="btn-primary">
          Voltar para Produtos
        </Link>
      </div>
    </div>
  );
}