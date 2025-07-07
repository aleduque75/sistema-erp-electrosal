'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

interface SaleItem {
  id: string;
  product: { name: string; price: number };
  quantity: number;
  price: number;
}

interface Sale {
  id: string;
  client: { name: string };
  totalAmount: number;
  saleDate: string;
  paymentMethod?: string; // Add paymentMethod to the interface
  saleItems: SaleItem[];
}

export default function SaleDetailPage() {
  const { user, loading } = useAuth();
  const { id } = useParams();
  const [sale, setSale] = useState<Sale | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && id) {
      fetchSale();
    }
  }, [user, loading, id]);

  const fetchSale = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await api.get(`/sales/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setSale({
        ...response.data,
        totalAmount: parseFloat(response.data.totalAmount),
        saleItems: response.data.saleItems.map((item: any) => ({
          ...item,
          price: parseFloat(item.price),
        })),
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to view sale details.</p>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  if (!sale) {
    return <p>Sale not found.</p>;
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold mb-4">Detalhes da Venda</h1>
      <p><strong>Cliente:</strong> {sale.client.name}</p>
      <p><strong>Valor Total:</strong> {sale.totalAmount.toFixed(2)}</p>
      <p><strong>Data da Venda:</strong> {new Date(sale.saleDate).toLocaleDateString()}</p>
      <p><strong>Método de Pagamento:</strong> {sale.paymentMethod}</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Itens Vendidos</h2>
      <table className="table-auto mb-4">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Preço por Unidade</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {sale.saleItems.map((item) => (
            <tr key={item.id}>
              <td>{item.product.name}</td>
              <td>{item.quantity}</td>
              <td>{item.price.toFixed(2)}</td>
              <td>{(item.quantity * item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4">
        <Link href="/sales" className="btn-primary">
          Voltar para Vendas
        </Link>
      </div>
    </div>
  );
}