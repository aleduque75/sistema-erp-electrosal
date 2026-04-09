'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

import { InstallmentList } from '@/components/sales/InstallmentList';
import { Sale } from '@/types/sale';

export default function SaleDetailPage() {
  const { user, isLoading } = useAuth();
  const params = useParams() as Record<string, string | string[]>;
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const [sale, setSale] = useState<Sale | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user && id) {
      fetchSale();
    }
  }, [user, isLoading, id]);

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
        installments: response.data.installments.map((installment: any) => ({
          ...installment,
          amount: parseFloat(installment.amount),
        })),
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
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
      <p><strong>Cliente:</strong> {sale.pessoa.name}</p>
      <p><strong>Valor Total:</strong> {sale.totalAmount.toFixed(2)}</p>
      <p><strong>Data da Venda:</strong> {new Date(sale.createdAt).toLocaleDateString()}</p>
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
          {sale.saleItems?.map((item: any) => (
            <tr key={item.id}>
              <td>{item.product.name}</td>
              <td>{item.quantity}</td>
              <td>{item.price.toFixed(2)}</td>
              <td>{(item.quantity * item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {sale.installments && sale.installments.length > 0 && (
        <InstallmentList 
          installments={sale.installments as any} 
          saleId={sale.id} 
          onInstallmentPaid={() => fetchSale()} 
        />
      )}

      <h2 className="text-xl font-bold mt-6 mb-2">Recebimentos</h2>
      <table className="table-auto mb-4">
        <thead>
          <tr>
            <th>Data</th>
            <th>Conta</th>
            <th>Valor (BRL)</th>
            <th>Valor (Au)</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            const uniqueMap = new Map();
            const sources = [
              ...(sale.accountsRec || []),
              ...(sale.installments?.map((i: any) => i.accountRec) || [])
            ].filter(Boolean);

            sources.forEach((ar: any) => {
              const txsRaw = ar.transacoes || ar.transacao || [];
              const txList = Array.isArray(txsRaw) ? txsRaw : [txsRaw];
              
              if (txList.length > 0) {
                txList.forEach((t: any) => {
                  if (t && t.id && !uniqueMap.has(t.id)) {
                    uniqueMap.set(t.id, {
                      ...t,
                      displayAccount: t.contaCorrente?.nome || ar.contaCorrente?.nome || 'N/A'
                    });
                  }
                });
              } else if (ar.received) {
                const virtualId = `virtual-${ar.id}`;
                if (!uniqueMap.has(virtualId)) {
                  uniqueMap.set(virtualId, {
                    id: virtualId,
                    dataHora: ar.receivedAt || ar.dueDate,
                    valor: ar.amountPaid || ar.amount,
                    goldAmount: ar.goldAmountPaid || ar.goldAmount,
                    displayAccount: ar.contaCorrente?.nome || 'Crédito de Metal/Outro',
                    isVirtual: true
                  });
                }
              }
            });

            return Array.from(uniqueMap.values()).map((transacao: any) => (
              <tr key={transacao.id}>
                <td>{transacao.dataHora ? new Date(transacao.dataHora).toLocaleDateString() : 'N/A'}</td>
                <td>{transacao.displayAccount}</td>
                <td>{Number(transacao.valor).toFixed(2)}</td>
                <td>{Number(transacao.goldAmount).toFixed(4)}</td>
              </tr>
            ));
          })()}
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